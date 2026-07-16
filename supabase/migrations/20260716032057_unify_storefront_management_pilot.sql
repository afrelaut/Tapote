-- Unifies the public storefront, the private management workspace and Pilot.
-- Remote migration version: 20260716032057.
-- The database remains a single multi-tenant source of truth: the platform
-- organization owns operations, while each customer receives an isolated
-- organization when their physical products are activated.

-- Supabase's historical defaults could leave non-DML privileges (notably
-- TRUNCATE) on future tables. New Data API objects are now fully opt-in.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

create table public.platform_settings (
  id boolean primary key default true check (id),
  management_organization_id uuid not null unique
    references public.organizations(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_provisioning (
  id uuid primary key default gen_random_uuid(),
  source_order_id uuid not null unique
    references public.orders(id) on delete cascade,
  management_order_id uuid unique
    references public.management_orders(id) on delete set null,
  customer_organization_id uuid
    references public.organizations(id) on delete restrict,
  customer_user_id uuid
    references auth.users(id) on delete restrict,
  status text not null default 'paid' check (status in (
    'paid', 'in_production', 'ready_for_activation', 'active',
    'shipped', 'cancelled', 'failed'
  )),
  last_error text check (last_error is null or char_length(last_error) <= 1000),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'active' and customer_organization_id is not null
      and customer_user_id is not null and activated_at is not null)
    or status <> 'active'
  )
);

create unique index management_orders_source_order_unique
  on public.management_orders(source_order_id)
  where source_order_id is not null;
create unique index management_clients_org_email_unique
  on public.management_clients(organization_id, lower(email))
  where email is not null and archived_at is null;
create index order_provisioning_status_idx
  on public.order_provisioning(status, created_at);
create index order_provisioning_customer_org_idx
  on public.order_provisioning(customer_organization_id)
  where customer_organization_id is not null;

create trigger platform_settings_updated_at
before update on public.platform_settings
for each row execute function private.set_updated_at();

create trigger order_provisioning_updated_at
before update on public.order_provisioning
for each row execute function private.set_updated_at();

alter table public.platform_settings enable row level security;
alter table public.order_provisioning enable row level security;

revoke all privileges on table public.platform_settings, public.order_provisioning
  from public, anon, authenticated, service_role;
grant select, insert, update, delete on table
  public.platform_settings, public.order_provisioning
  to service_role;

create policy deny_browser_access on public.platform_settings
for all to anon, authenticated using (false) with check (false);
create policy deny_browser_access on public.order_provisioning
for all to anon, authenticated using (false) with check (false);

-- Reset the management tables created after the stricter defaults migration;
-- this removes inherited TRUNCATE/REFERENCES/TRIGGER privileges before adding
-- the exact browser operations used by TAPOTE Gestion.
revoke all privileges on table
  public.management_profiles,
  public.management_clients,
  public.management_inventory_items,
  public.management_storefront_products,
  public.management_orders,
  public.management_order_events,
  public.management_suppliers,
  public.management_purchase_orders,
  public.management_purchase_order_items,
  public.management_production_jobs,
  public.management_shipments,
  public.management_activity,
  public.management_audit_logs,
  public.management_settings
from authenticated, service_role;

grant select, insert, update, delete on table
  public.management_profiles,
  public.management_clients,
  public.management_inventory_items,
  public.management_storefront_products,
  public.management_orders,
  public.management_suppliers,
  public.management_purchase_orders,
  public.management_purchase_order_items,
  public.management_production_jobs,
  public.management_shipments,
  public.management_activity
to authenticated;
grant select on table public.management_order_events, public.management_audit_logs
  to authenticated;
grant select, insert, update on table public.management_settings to authenticated;
grant usage, select on sequence
  public.management_order_events_id_seq,
  public.management_activity_id_seq,
  public.management_audit_logs_id_seq
to authenticated;

-- service_role is reserved for trusted server workers and Edge Functions. RLS
-- remains enabled, and the role is intentionally not granted TRUNCATE.
grant select, insert, update, delete on table
  public.orders,
  public.order_items,
  public.stripe_events,
  public.leads,
  public.uploads,
  public.outbox_jobs,
  public.organizations,
  public.organization_members,
  public.locations,
  public.tapote_links,
  public.tap_events,
  public.audit_logs,
  public.subscriptions,
  public.tapote_products,
  public.management_profiles,
  public.management_clients,
  public.management_inventory_items,
  public.management_storefront_products,
  public.management_orders,
  public.management_order_events,
  public.management_suppliers,
  public.management_purchase_orders,
  public.management_purchase_order_items,
  public.management_production_jobs,
  public.management_shipments,
  public.management_activity,
  public.management_audit_logs,
  public.management_settings
to service_role;
grant usage, select on sequence
  public.tap_events_id_seq,
  public.audit_logs_id_seq,
  public.management_order_events_id_seq,
  public.management_activity_id_seq,
  public.management_audit_logs_id_seq
to service_role;

create or replace function private.storefront_product_name(product_id text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case product_id
    when 'comptoir' then 'Le Comptoir A6'
    when 'table6' then 'Les Chevalets A6 ×6'
    when 'carte' then 'La Carte'
    when 'sticker' then 'La Vitrine'
    when 'pack_resto' then 'Pack Restaurant'
    when 'pack_salon' then 'Pack Salon'
    when 'pack_equipe' then 'Pack Équipe'
    else left(product_id, 160)
  end;
$$;
revoke all on function private.storefront_product_name(text)
  from public, anon, authenticated, service_role;

create or replace function private.sync_storefront_order_to_management()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  platform_organization_id uuid;
  management_client_id uuid;
  management_order_id uuid;
  product_summary text;
  product_quantity integer;
  mapped_status text;
  mapped_payment text;
  was_linked boolean;
begin
  if tg_op = 'UPDATE' and not (
    old.status is distinct from new.status
    or old.customer_business_name is distinct from new.customer_business_name
    or old.customer_email is distinct from new.customer_email
    or old.destination_url is distinct from new.destination_url
    or old.amount_total is distinct from new.amount_total
  ) then
    return new;
  end if;

  if new.status not in (
    'paid', 'in_production', 'shipped', 'delivered',
    'refunded', 'cancelled'
  ) then
    return new;
  end if;

  select settings.management_organization_id
    into platform_organization_id
  from public.platform_settings settings
  where settings.id = true;

  -- Bootstrap is explicit: until a platform organization exists, commercial
  -- writes remain valid and are never routed to an arbitrary tenant.
  if platform_organization_id is null then
    return new;
  end if;

  select clients.id
    into management_client_id
  from public.management_clients clients
  where clients.organization_id = platform_organization_id
    and clients.archived_at is null
    and lower(clients.email) = lower(new.customer_email)
  order by clients.created_at
  limit 1;

  if management_client_id is null then
    insert into public.management_clients (
      organization_id, client_code, name, contact_name, email,
      segment, health, joined_on
    ) values (
      platform_organization_id,
      'WEB-' || upper(substr(replace(new.order_token::text, '-', ''), 1, 8)),
      new.customer_business_name,
      new.customer_business_name,
      lower(new.customer_email),
      'Boutique en ligne',
      'Actif',
      new.created_at::date
    )
    on conflict do nothing
    returning id into management_client_id;

    if management_client_id is null then
      select clients.id
        into management_client_id
      from public.management_clients clients
      where clients.organization_id = platform_organization_id
        and clients.archived_at is null
        and lower(clients.email) = lower(new.customer_email)
      order by clients.created_at
      limit 1;
    end if;
  end if;

  if management_client_id is null then
    raise exception 'storefront_client_sync_failed' using errcode = 'P0001';
  end if;

  select
    coalesce(string_agg(
      items.quantity::text || ' × ' || private.storefront_product_name(items.product_id),
      ' · ' order by items.created_at, items.id
    ), 'Commande Tapote'),
    coalesce(sum(items.quantity), 1)::integer
  into product_summary, product_quantity
  from public.order_items items
  where items.order_id = new.id;

  mapped_status := case new.status
    when 'paid' then 'paid'
    when 'in_production' then 'assembly'
    when 'shipped' then 'shipped'
    when 'delivered' then 'shipped'
    else 'cancelled'
  end;
  mapped_payment := case new.status
    when 'refunded' then 'Remboursé'
    when 'cancelled' then 'En attente'
    else 'Payé'
  end;

  select exists (
    select 1 from public.management_orders orders
    where orders.source_order_id = new.id
  ) into was_linked;

  insert into public.management_orders (
    organization_id, order_number, client_id, product_name, quantity,
    total_cents, status, payment_status, channel, ordered_on,
    destination, source_order_id, shipped_at, note
  ) values (
    platform_organization_id,
    'WEB-' || upper(substr(replace(new.order_token::text, '-', ''), 1, 10)),
    management_client_id,
    left(product_summary, 160),
    greatest(product_quantity, 1),
    coalesce(new.amount_total, 0),
    mapped_status,
    mapped_payment,
    'Boutique tapote.fr',
    new.created_at::date,
    new.destination_url,
    new.id,
    new.shipped_at,
    'Synchronisée automatiquement depuis tapote.fr'
  )
  on conflict (source_order_id) where source_order_id is not null
  do update set
    client_id = excluded.client_id,
    product_name = excluded.product_name,
    quantity = excluded.quantity,
    total_cents = excluded.total_cents,
    status = case
      when excluded.status = 'paid'
        and public.management_orders.status not in ('paid', 'cancelled')
      then public.management_orders.status
      else excluded.status
    end,
    payment_status = excluded.payment_status,
    destination = excluded.destination,
    shipped_at = excluded.shipped_at,
    updated_at = now()
  returning id into management_order_id;

  insert into public.order_provisioning (
    source_order_id, management_order_id, status
  ) values (
    new.id,
    management_order_id,
    case new.status
      when 'paid' then 'paid'
      when 'in_production' then 'in_production'
      when 'shipped' then 'shipped'
      when 'delivered' then 'shipped'
      else 'cancelled'
    end
  )
  on conflict (source_order_id) do update set
    management_order_id = excluded.management_order_id,
    status = case
      when public.order_provisioning.status = 'active'
        and excluded.status <> 'cancelled'
      then 'active'
      else excluded.status
    end,
    updated_at = now();

  if new.status in ('paid', 'in_production') then
    insert into public.management_production_jobs (
      organization_id, order_id, stage
    ) values (
      platform_organization_id, management_order_id, 'bat'
    ) on conflict (organization_id, order_id) do nothing;
  elsif new.status in ('shipped', 'delivered') then
    update public.management_production_jobs
      set stage = 'done', completed_at = coalesce(completed_at, now())
    where organization_id = platform_organization_id
      and order_id = management_order_id
      and stage <> 'done';
  end if;

  if not was_linked then
    insert into public.management_activity (
      organization_id, kind, description, metadata
    ) values (
      platform_organization_id,
      'system',
      'Commande web ' || 'WEB-' || upper(substr(replace(new.order_token::text, '-', ''), 1, 10)) || ' importée automatiquement',
      jsonb_build_object('source_order_id', new.id, 'management_order_id', management_order_id)
    );
  end if;

  return new;
end;
$$;
revoke all on function private.sync_storefront_order_to_management()
  from public, anon, authenticated, service_role;

create trigger storefront_order_sync_after_write
after insert or update on public.orders
for each row execute function private.sync_storefront_order_to_management();

create or replace function private.sync_management_order_to_storefront()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  storefront_status text;
  provisioning_status text;
begin
  if new.source_order_id is null
    or (tg_op = 'UPDATE' and old.status is not distinct from new.status) then
    return new;
  end if;

  storefront_status := case new.status
    when 'paid' then 'paid'
    when 'bat' then 'in_production'
    when 'supply' then 'in_production'
    when 'assembly' then 'in_production'
    when 'quality' then 'in_production'
    when 'ready' then 'in_production'
    when 'shipped' then 'shipped'
    else 'cancelled'
  end;
  provisioning_status := case new.status
    when 'paid' then 'paid'
    when 'ready' then 'ready_for_activation'
    when 'shipped' then 'shipped'
    when 'cancelled' then 'cancelled'
    else 'in_production'
  end;

  update public.orders orders
    set status = storefront_status,
      shipped_at = case
        when storefront_status = 'shipped' then coalesce(orders.shipped_at, now())
        else orders.shipped_at
      end
  where orders.id = new.source_order_id
    and orders.status is distinct from storefront_status;

  update public.order_provisioning provisioning
    set status = case
      when provisioning.status = 'active' and provisioning_status <> 'cancelled'
      then 'active'
      else provisioning_status
    end
  where provisioning.source_order_id = new.source_order_id;

  return new;
end;
$$;
revoke all on function private.sync_management_order_to_storefront()
  from public, anon, authenticated, service_role;

create trigger management_order_storefront_sync_after_write
after insert or update of status on public.management_orders
for each row execute function private.sync_management_order_to_storefront();

create or replace function public.get_management_integrations(
  target_organization_id uuid
)
returns table (
  management_order_id uuid,
  source_order_id uuid,
  customer_organization_id uuid,
  customer_user_id uuid,
  provisioning_status text,
  activated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    orders.id,
    orders.source_order_id,
    provisioning.customer_organization_id,
    provisioning.customer_user_id,
    provisioning.status,
    provisioning.activated_at
  from public.management_orders orders
  left join public.order_provisioning provisioning
    on provisioning.management_order_id = orders.id
  where orders.organization_id = target_organization_id
    and orders.source_order_id is not null
    and (select private.is_management_member(target_organization_id));
$$;
revoke all on function public.get_management_integrations(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.get_management_integrations(uuid)
  to authenticated;

-- Activates a paid web order into an isolated Pilot workspace. Auth user
-- creation stays in the trusted server/Admin API; this RPC only accepts a
-- confirmed user whose email matches the source order.
create or replace function public.activate_customer_workspace(
  target_management_order_id uuid,
  target_customer_user_id uuid,
  target_location_name text default 'Établissement principal',
  target_url text default null
)
returns table (
  organization_id uuid,
  location_id uuid,
  products_created integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  management_order public.management_orders;
  source_order public.orders;
  existing_provisioning public.order_provisioning;
  customer_email text;
  created_organization_id uuid;
  created_location_id uuid;
  destination_url text;
  item record;
  purchase_index integer;
  unit_index integer;
  units_per_purchase integer;
  physical_type text;
  product_label text;
  created_link_id uuid;
  created_count integer := 0;
begin
  select * into management_order
  from public.management_orders orders
  where orders.id = target_management_order_id;

  if management_order.id is null
    or not (select private.is_management_member(management_order.organization_id)) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;
  if management_order.organization_id is distinct from (
    select settings.management_organization_id
    from public.platform_settings settings where settings.id = true
  ) then
    raise exception 'platform_order_required' using errcode = '22023';
  end if;
  if management_order.source_order_id is null then
    raise exception 'storefront_order_required' using errcode = '22023';
  end if;

  select * into source_order
  from public.orders orders
  where orders.id = management_order.source_order_id;

  select users.email into customer_email
  from auth.users users
  where users.id = target_customer_user_id
    and users.email_confirmed_at is not null;
  if customer_email is null
    or lower(customer_email) <> lower(source_order.customer_email) then
    raise exception 'confirmed_customer_email_mismatch' using errcode = '22023';
  end if;

  destination_url := coalesce(nullif(target_url, ''), source_order.destination_url);
  if destination_url is null
    or destination_url !~ '^https://'
    or char_length(destination_url) > 500 then
    raise exception 'valid_https_destination_required' using errcode = '22023';
  end if;
  if char_length(trim(target_location_name)) not between 1 and 150 then
    raise exception 'valid_location_name_required' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(source_order.id::text, 0));
  select * into existing_provisioning
  from public.order_provisioning provisioning
  where provisioning.source_order_id = source_order.id
  for update;

  if existing_provisioning.customer_organization_id is not null then
    return query
      select existing_provisioning.customer_organization_id,
        locations.id,
        count(products.id)::integer
      from public.locations locations
      left join public.tapote_products products
        on products.organization_id = locations.organization_id
      where locations.organization_id = existing_provisioning.customer_organization_id
      group by locations.id
      order by locations.created_at
      limit 1;
    return;
  end if;

  insert into public.organizations(name, created_by)
  values (source_order.customer_business_name, target_customer_user_id)
  returning id into created_organization_id;

  insert into public.locations(organization_id, name)
  values (created_organization_id, trim(target_location_name))
  returning id into created_location_id;

  for item in
    select items.*
    from public.order_items items
    where items.order_id = source_order.id
    order by items.created_at, items.id
  loop
    units_per_purchase := case item.product_id
      when 'table6' then 6
      when 'pack_resto' then 7
      when 'pack_salon' then 2
      when 'pack_equipe' then 7
      else 1
    end;

    for purchase_index in 1..item.quantity loop
      for unit_index in 1..units_per_purchase loop
        physical_type := case
          when item.product_id = 'pack_resto' and unit_index = 1 then 'comptoir'
          when item.product_id = 'pack_resto' then 'table6'
          when item.product_id = 'pack_salon' then 'comptoir'
          when item.product_id = 'pack_equipe' and unit_index <= 6 then 'carte'
          when item.product_id = 'pack_equipe' then 'sticker'
          else item.product_id
        end;
        product_label := private.storefront_product_name(item.product_id);
        if item.quantity * units_per_purchase > 1 then
          product_label := left(
            product_label || ' · ' || (((purchase_index - 1) * units_per_purchase) + unit_index)::text,
            100
          );
        end if;

        insert into public.tapote_links (
          organization_id, location_id, label, target_url
        ) values (
          created_organization_id, created_location_id,
          product_label, destination_url
        ) returning id into created_link_id;

        insert into public.tapote_products (
          organization_id, location_id, tapote_link_id, order_item_id,
          product_type, action_id, label, serial_number, status, activated_at
        ) values (
          created_organization_id, created_location_id, created_link_id, item.id,
          physical_type, item.action_id, product_label,
          'TAP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
          'active', now()
        );
        created_count := created_count + 1;
      end loop;
    end loop;
  end loop;

  if created_count = 0 then
    raise exception 'order_has_no_products' using errcode = '22023';
  end if;

  update public.order_provisioning provisioning
    set customer_organization_id = created_organization_id,
      customer_user_id = target_customer_user_id,
      status = 'active',
      last_error = null,
      activated_at = now()
  where provisioning.source_order_id = source_order.id;

  insert into public.management_activity (
    organization_id, kind, description, metadata
  ) values (
    management_order.organization_id,
    'system',
    'Espace Pilot activé pour ' || source_order.customer_business_name,
    jsonb_build_object(
      'source_order_id', source_order.id,
      'customer_organization_id', created_organization_id,
      'products_created', created_count
    )
  );

  return query select created_organization_id, created_location_id, created_count;
end;
$$;
revoke all on function public.activate_customer_workspace(uuid, uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.activate_customer_workspace(uuid, uuid, text, text)
  to authenticated;

comment on table public.platform_settings is
  'Configuration singleton qui identifie l organisation interne TAPOTE.';
comment on table public.order_provisioning is
  'État de liaison commande web -> Gestion -> espace client Pilot.';
comment on function public.activate_customer_workspace(uuid, uuid, text, text) is
  'Activation idempotente d une commande web dans un tenant Pilot isolé.';
