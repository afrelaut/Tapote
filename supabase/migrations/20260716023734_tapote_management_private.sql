-- TAPOTE Gestion: domaine interne privé, réservé aux gérants explicitement
-- Remote migration version: 20260716023734.
-- rattachés à une organisation avec le rôle owner, admin ou manager.

alter table public.organization_members
  drop constraint if exists organization_members_role_check;
alter table public.organization_members
  add constraint organization_members_role_check
  check (role in ('owner', 'admin', 'manager', 'member', 'viewer'));

create or replace function private.is_management_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members memberships
    where memberships.organization_id = target_organization_id
      and memberships.user_id = (select auth.uid())
      and memberships.role in ('owner', 'admin', 'manager')
  );
$$;
revoke all on function private.is_management_member(uuid) from public, anon;
grant execute on function private.is_management_member(uuid) to authenticated;

create table public.management_profiles (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 100),
  job_title text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  constraint management_profiles_membership_fkey
    foreign key (organization_id, user_id)
    references public.organization_members(organization_id, user_id) on delete cascade
);

create table public.management_clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_code text not null,
  name text not null check (char_length(name) between 1 and 160),
  contact_name text,
  email text,
  phone text,
  city text,
  segment text,
  health text not null default 'Nouveau' check (health in ('Nouveau', 'Actif', 'À suivre', 'Inactif')),
  joined_on date not null default current_date,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, client_code)
);

create table public.management_inventory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sku text not null,
  name text not null check (char_length(name) between 1 and 160),
  category text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  threshold_quantity integer not null default 0 check (threshold_quantity >= 0),
  incoming_quantity integer not null default 0 check (incoming_quantity >= 0),
  eta_date date,
  unit_cost_cents integer check (unit_cost_cents is null or unit_cost_cents >= 0),
  storage_location text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, sku),
  check (reserved_quantity <= stock_quantity)
);

create table public.management_storefront_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inventory_item_id uuid,
  external_product_id text,
  name text not null check (char_length(name) between 1 and 160),
  price_cents integer not null check (price_cents >= 0),
  online boolean not null default false,
  sales_count integer not null default 0 check (sales_count >= 0),
  conversion_rate numeric(6,3) check (conversion_rate is null or conversion_rate between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  constraint management_storefront_inventory_fkey
    foreign key (organization_id, inventory_item_id)
    references public.management_inventory_items(organization_id, id) on delete restrict
);

create table public.management_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_number text not null,
  client_id uuid not null,
  product_name text not null check (char_length(product_name) between 1 and 160),
  quantity integer not null check (quantity between 1 and 1000),
  total_cents integer not null check (total_cents >= 0),
  status text not null default 'paid' check (status in ('paid', 'bat', 'supply', 'assembly', 'quality', 'ready', 'shipped', 'cancelled')),
  payment_status text not null default 'Payé' check (payment_status in ('En attente', 'Payé', 'Remboursé', 'Échoué')),
  channel text not null default 'Boutique',
  ordered_on date not null default current_date,
  due_on date,
  priority text not null default 'Normale' check (priority in ('Basse', 'Normale', 'Haute', 'Urgente')),
  owner_name text,
  destination text,
  tracking_number text,
  note text,
  source_order_id uuid references public.orders(id) on delete set null,
  shipped_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, order_number),
  constraint management_orders_client_fkey
    foreign key (organization_id, client_id)
    references public.management_clients(organization_id, id) on delete restrict
);

create table public.management_order_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_id uuid not null,
  event_type text not null,
  from_status text,
  to_status text,
  actor_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint management_order_events_order_fkey
    foreign key (organization_id, order_id)
    references public.management_orders(organization_id, id) on delete cascade
);

create table public.management_suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  lead_time_days integer check (lead_time_days is null or lead_time_days >= 0),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, name)
);

create table public.management_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null,
  purchase_number text not null,
  status text not null default 'draft' check (status in ('draft', 'ordered', 'partial', 'received', 'cancelled')),
  ordered_on date,
  expected_on date,
  total_cents integer not null default 0 check (total_cents >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, purchase_number),
  constraint management_purchase_orders_supplier_fkey
    foreign key (organization_id, supplier_id)
    references public.management_suppliers(organization_id, id) on delete restrict
);

create table public.management_purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  purchase_order_id uuid not null,
  inventory_item_id uuid not null,
  quantity integer not null check (quantity > 0),
  received_quantity integer not null default 0 check (received_quantity >= 0 and received_quantity <= quantity),
  unit_cost_cents integer not null check (unit_cost_cents >= 0),
  created_at timestamptz not null default now(),
  constraint management_purchase_items_order_fkey
    foreign key (organization_id, purchase_order_id)
    references public.management_purchase_orders(organization_id, id) on delete cascade,
  constraint management_purchase_items_inventory_fkey
    foreign key (organization_id, inventory_item_id)
    references public.management_inventory_items(organization_id, id) on delete restrict
);

create table public.management_production_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_id uuid not null,
  stage text not null default 'bat' check (stage in ('bat', 'supply', 'assembly', 'quality', 'ready', 'done')),
  assigned_to uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  checklist jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, order_id),
  constraint management_production_order_fkey
    foreign key (organization_id, order_id)
    references public.management_orders(organization_id, id) on delete cascade
);

create table public.management_shipments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_id uuid not null,
  carrier text,
  service text,
  tracking_number text,
  status text not null default 'preparing' check (status in ('preparing', 'label_created', 'handed_over', 'in_transit', 'delivered', 'exception', 'returned')),
  label_storage_path text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, order_id),
  constraint management_shipments_order_fkey
    foreign key (organization_id, order_id)
    references public.management_orders(organization_id, id) on delete cascade
);

create table public.management_activity (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  kind text not null check (kind in ('order', 'stock', 'client', 'ship', 'supply', 'system')),
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.management_audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create table public.management_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  order_prefix text not null default 'TPT' check (order_prefix ~ '^[A-Z0-9]{2,8}$'),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Europe/Paris',
  low_stock_notifications boolean not null default true,
  shipping_cutoff time not null default '16:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index management_clients_org_name_idx on public.management_clients(organization_id, name) where archived_at is null;
create index management_orders_org_status_due_idx on public.management_orders(organization_id, status, due_on) where status not in ('shipped', 'cancelled');
create index management_orders_client_idx on public.management_orders(organization_id, client_id, ordered_on desc);
create index management_inventory_alert_idx on public.management_inventory_items(organization_id, stock_quantity, reserved_quantity, threshold_quantity) where archived_at is null;
create index management_activity_org_time_idx on public.management_activity(organization_id, created_at desc);
create index management_audit_org_time_idx on public.management_audit_logs(organization_id, created_at desc);
create index management_purchase_org_status_idx on public.management_purchase_orders(organization_id, status, expected_on);
create index management_order_events_order_time_idx on public.management_order_events(organization_id, order_id, created_at desc);

create trigger management_profiles_updated_at before update on public.management_profiles for each row execute function private.set_updated_at();
create trigger management_clients_updated_at before update on public.management_clients for each row execute function private.set_updated_at();
create trigger management_inventory_updated_at before update on public.management_inventory_items for each row execute function private.set_updated_at();
create trigger management_storefront_updated_at before update on public.management_storefront_products for each row execute function private.set_updated_at();
create trigger management_orders_updated_at before update on public.management_orders for each row execute function private.set_updated_at();
create trigger management_suppliers_updated_at before update on public.management_suppliers for each row execute function private.set_updated_at();
create trigger management_purchase_orders_updated_at before update on public.management_purchase_orders for each row execute function private.set_updated_at();
create trigger management_production_updated_at before update on public.management_production_jobs for each row execute function private.set_updated_at();
create trigger management_shipments_updated_at before update on public.management_shipments for each row execute function private.set_updated_at();
create trigger management_settings_updated_at before update on public.management_settings for each row execute function private.set_updated_at();

create or replace function private.audit_management_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.management_audit_logs (
      organization_id, actor_user_id, action, entity_type, entity_id, old_data
    ) values (
      old.organization_id, (select auth.uid()), lower(tg_op), tg_table_name, old.id, to_jsonb(old)
    );
    return old;
  end if;
  insert into public.management_audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, old_data, new_data
  ) values (
    new.organization_id,
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    new.id,
    case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
    to_jsonb(new)
  );
  return new;
end;
$$;
revoke all on function private.audit_management_change() from public, anon, authenticated;

create trigger management_clients_audit after insert or update or delete on public.management_clients for each row execute function private.audit_management_change();
create trigger management_inventory_audit after insert or update or delete on public.management_inventory_items for each row execute function private.audit_management_change();
create trigger management_storefront_audit after insert or update or delete on public.management_storefront_products for each row execute function private.audit_management_change();
create trigger management_orders_audit after insert or update or delete on public.management_orders for each row execute function private.audit_management_change();
create trigger management_suppliers_audit after insert or update or delete on public.management_suppliers for each row execute function private.audit_management_change();
create trigger management_purchase_orders_audit after insert or update or delete on public.management_purchase_orders for each row execute function private.audit_management_change();
create trigger management_production_audit after insert or update or delete on public.management_production_jobs for each row execute function private.audit_management_change();
create trigger management_shipments_audit after insert or update or delete on public.management_shipments for each row execute function private.audit_management_change();

create or replace function private.record_management_order_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.management_order_events (organization_id, order_id, event_type, to_status)
    values (new.organization_id, new.id, 'created', new.status);
  elsif old.status is distinct from new.status then
    insert into public.management_order_events (organization_id, order_id, event_type, from_status, to_status)
    values (new.organization_id, new.id, 'status_changed', old.status, new.status);
  end if;
  return new;
end;
$$;
revoke all on function private.record_management_order_event() from public, anon, authenticated;
create trigger management_order_event_after_write after insert or update on public.management_orders for each row execute function private.record_management_order_event();

create or replace function public.create_management_order(
  target_organization_id uuid,
  target_client_id uuid,
  target_product_name text,
  target_quantity integer,
  target_total_cents integer,
  target_due_on date,
  target_channel text,
  target_destination text,
  target_owner_name text default null
)
returns public.management_orders
language plpgsql
security invoker
set search_path = ''
as $$
declare
  order_prefix text;
  next_number integer;
  created_order public.management_orders;
begin
  if not (select private.is_management_member(target_organization_id)) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(target_organization_id::text, 0));
  select coalesce(settings.order_prefix, 'TPT') into order_prefix
  from public.management_settings settings
  where settings.organization_id = target_organization_id;
  order_prefix := coalesce(order_prefix, 'TPT');
  select coalesce(max(nullif(regexp_replace(orders.order_number, '\\D', '', 'g'), '')::integer), 1048) + 1
    into next_number
  from public.management_orders orders
  where orders.organization_id = target_organization_id;
  insert into public.management_orders (
    organization_id, order_number, client_id, product_name, quantity,
    total_cents, due_on, channel, destination, owner_name
  ) values (
    target_organization_id, order_prefix || '-' || next_number, target_client_id,
    target_product_name, target_quantity, target_total_cents, target_due_on,
    coalesce(target_channel, 'Boutique'), target_destination, target_owner_name
  ) returning * into created_order;
  return created_order;
end;
$$;
revoke all on function public.create_management_order(uuid, uuid, text, integer, integer, date, text, text, text) from public, anon;
grant execute on function public.create_management_order(uuid, uuid, text, integer, integer, date, text, text, text) to authenticated;

alter table public.management_profiles enable row level security;
alter table public.management_clients enable row level security;
alter table public.management_inventory_items enable row level security;
alter table public.management_storefront_products enable row level security;
alter table public.management_orders enable row level security;
alter table public.management_order_events enable row level security;
alter table public.management_suppliers enable row level security;
alter table public.management_purchase_orders enable row level security;
alter table public.management_purchase_order_items enable row level security;
alter table public.management_production_jobs enable row level security;
alter table public.management_shipments enable row level security;
alter table public.management_activity enable row level security;
alter table public.management_audit_logs enable row level security;
alter table public.management_settings enable row level security;

revoke all on public.management_profiles, public.management_clients, public.management_inventory_items,
  public.management_storefront_products, public.management_orders, public.management_order_events,
  public.management_suppliers, public.management_purchase_orders, public.management_purchase_order_items,
  public.management_production_jobs, public.management_shipments, public.management_activity,
  public.management_audit_logs, public.management_settings from anon;
grant select, insert, update, delete on public.management_profiles, public.management_clients,
  public.management_inventory_items, public.management_storefront_products, public.management_orders,
  public.management_suppliers, public.management_purchase_orders, public.management_purchase_order_items,
  public.management_production_jobs, public.management_shipments, public.management_activity to authenticated;
grant select on public.management_order_events, public.management_audit_logs to authenticated;
grant select, insert, update on public.management_settings to authenticated;
grant usage, select on sequence public.management_order_events_id_seq,
  public.management_activity_id_seq, public.management_audit_logs_id_seq to authenticated;

create policy management_profiles_all on public.management_profiles for all to authenticated
using ((select private.is_management_member(organization_id)))
with check ((select private.is_management_member(organization_id)) and (user_id = (select auth.uid()) or (select private.has_org_role(organization_id, array['owner', 'admin']))));
create policy management_clients_all on public.management_clients for all to authenticated
using ((select private.is_management_member(organization_id))) with check ((select private.is_management_member(organization_id)));
create policy management_inventory_all on public.management_inventory_items for all to authenticated
using ((select private.is_management_member(organization_id))) with check ((select private.is_management_member(organization_id)));
create policy management_storefront_all on public.management_storefront_products for all to authenticated
using ((select private.is_management_member(organization_id))) with check ((select private.is_management_member(organization_id)));
create policy management_orders_all on public.management_orders for all to authenticated
using ((select private.is_management_member(organization_id))) with check ((select private.is_management_member(organization_id)));
create policy management_order_events_select on public.management_order_events for select to authenticated
using ((select private.is_management_member(organization_id)));
create policy management_suppliers_all on public.management_suppliers for all to authenticated
using ((select private.is_management_member(organization_id))) with check ((select private.is_management_member(organization_id)));
create policy management_purchase_orders_all on public.management_purchase_orders for all to authenticated
using ((select private.is_management_member(organization_id))) with check ((select private.is_management_member(organization_id)));
create policy management_purchase_items_all on public.management_purchase_order_items for all to authenticated
using ((select private.is_management_member(organization_id))) with check ((select private.is_management_member(organization_id)));
create policy management_production_all on public.management_production_jobs for all to authenticated
using ((select private.is_management_member(organization_id))) with check ((select private.is_management_member(organization_id)));
create policy management_shipments_all on public.management_shipments for all to authenticated
using ((select private.is_management_member(organization_id))) with check ((select private.is_management_member(organization_id)));
create policy management_activity_all on public.management_activity for all to authenticated
using ((select private.is_management_member(organization_id))) with check ((select private.is_management_member(organization_id)));
create policy management_audit_select on public.management_audit_logs for select to authenticated
using ((select private.is_management_member(organization_id)));
create policy management_settings_select on public.management_settings for select to authenticated
using ((select private.is_management_member(organization_id)));
create policy management_settings_insert on public.management_settings for insert to authenticated
with check ((select private.has_org_role(organization_id, array['owner', 'admin'])));
create policy management_settings_update on public.management_settings for update to authenticated
using ((select private.has_org_role(organization_id, array['owner', 'admin'])))
with check ((select private.has_org_role(organization_id, array['owner', 'admin'])));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tapote-management-private',
  'tapote-management-private',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy management_storage_select on storage.objects for select to authenticated
using (
  bucket_id = 'tapote-management-private'
  and exists (
    select 1 from public.organization_members memberships
    where memberships.user_id = (select auth.uid())
      and memberships.role in ('owner', 'admin', 'manager')
      and memberships.organization_id::text = (storage.foldername(name))[1]
  )
);
create policy management_storage_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'tapote-management-private'
  and exists (
    select 1 from public.organization_members memberships
    where memberships.user_id = (select auth.uid())
      and memberships.role in ('owner', 'admin', 'manager')
      and memberships.organization_id::text = (storage.foldername(name))[1]
  )
);
create policy management_storage_update on storage.objects for update to authenticated
using (
  bucket_id = 'tapote-management-private'
  and exists (
    select 1 from public.organization_members memberships
    where memberships.user_id = (select auth.uid())
      and memberships.role in ('owner', 'admin', 'manager')
      and memberships.organization_id::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'tapote-management-private'
  and exists (
    select 1 from public.organization_members memberships
    where memberships.user_id = (select auth.uid())
      and memberships.role in ('owner', 'admin', 'manager')
      and memberships.organization_id::text = (storage.foldername(name))[1]
  )
);
create policy management_storage_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'tapote-management-private'
  and exists (
    select 1 from public.organization_members memberships
    where memberships.user_id = (select auth.uid())
      and memberships.role in ('owner', 'admin', 'manager')
      and memberships.organization_id::text = (storage.foldername(name))[1]
  )
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'management_clients', 'management_inventory_items', 'management_storefront_products',
    'management_orders', 'management_activity', 'management_purchase_orders',
    'management_production_jobs', 'management_shipments'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
