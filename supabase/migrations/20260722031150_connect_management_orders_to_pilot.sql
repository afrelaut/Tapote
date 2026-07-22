begin;

-- A workshop unit is private to Gestion until it is explicitly assigned to a
-- customer order. Once activated, the same physical short link is moved into
-- the customer's Pilot organization so the NFC/QR already encoded in the
-- support keeps working.
alter table public.tapote_products
  add column if not exists management_product_unit_id uuid
    unique references public.management_product_units(id) on delete restrict;

create index if not exists tapote_products_management_unit_idx
  on public.tapote_products(management_product_unit_id)
  where management_product_unit_id is not null;

create or replace function private.assign_management_encoded_product(
  target_organization_id uuid,
  target_product_unit_id uuid,
  target_client_id uuid,
  target_order_id uuid
)
returns public.management_product_units
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_order public.management_orders;
  selected_client public.management_clients;
  current_unit public.management_product_units;
  updated_unit public.management_product_units;
begin
  if (select auth.uid()) is null
    or not (select private.is_management_member(target_organization_id)) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;

  select * into selected_order
  from public.management_orders orders
  where orders.id = target_order_id
    and orders.organization_id = target_organization_id;
  if selected_order.id is null then
    raise exception 'invalid_management_order' using errcode = '22023';
  end if;

  select * into selected_client
  from public.management_clients clients
  where clients.id = target_client_id
    and clients.organization_id = target_organization_id
    and clients.archived_at is null;
  if selected_client.id is null
    or selected_order.client_id is distinct from selected_client.id then
    raise exception 'invalid_client_order_pair' using errcode = '22023';
  end if;

  select * into current_unit
  from public.management_product_units units
  where units.id = target_product_unit_id
    and units.organization_id = target_organization_id
  for update;
  if current_unit.id is null then
    raise exception 'management_product_unit_not_found' using errcode = '22023';
  end if;
  if current_unit.status = 'assigned'
    and current_unit.client_id = target_client_id
    and current_unit.order_id = target_order_id then
    return current_unit;
  end if;
  if current_unit.status <> 'locked' then
    raise exception 'product_must_be_locked_before_assignment' using errcode = '22023';
  end if;

  update public.management_product_units units
  set client_id = target_client_id,
      order_id = target_order_id,
      status = 'assigned'
  where units.id = target_product_unit_id
    and units.organization_id = target_organization_id
    and units.status = 'locked'
  returning * into updated_unit;

  if updated_unit.id is null then
    raise exception 'management_product_unit_conflict' using errcode = '40001';
  end if;
  return updated_unit;
end;
$$;

revoke all on function private.assign_management_encoded_product(uuid, uuid, uuid, uuid)
  from public, anon;
grant execute on function private.assign_management_encoded_product(uuid, uuid, uuid, uuid)
  to authenticated;

create or replace function public.assign_management_encoded_product(
  target_organization_id uuid,
  target_product_unit_id uuid,
  target_client_id uuid,
  target_order_id uuid
)
returns public.management_product_units
language sql
security invoker
set search_path = ''
as $$
  select private.assign_management_encoded_product(
    target_organization_id,
    target_product_unit_id,
    target_client_id,
    target_order_id
  );
$$;

revoke all on function public.assign_management_encoded_product(uuid, uuid, uuid, uuid)
  from public, anon;
grant execute on function public.assign_management_encoded_product(uuid, uuid, uuid, uuid)
  to authenticated;

-- Assignment is no longer a blind status transition: it must select and
-- validate the exact client/order pair through the RPC above.
create or replace function private.advance_management_encoded_product(
  target_organization_id uuid,
  target_product_unit_id uuid,
  expected_status text,
  target_status text,
  target_iphone_test boolean default false,
  target_android_test boolean default false,
  target_qr_test boolean default false
)
returns public.management_product_units
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_unit public.management_product_units;
begin
  if (select auth.uid()) is null
    or not (select private.is_management_member(target_organization_id)) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;
  if not (
    (expected_status = 'draft' and target_status = 'encoded') or
    (expected_status = 'encoded' and target_status = 'tested') or
    (expected_status = 'tested' and target_status = 'locked')
  ) then
    raise exception 'invalid_encoding_transition' using errcode = '22023';
  end if;
  if target_status = 'tested' and not (
    target_iphone_test and target_android_test and target_qr_test
  ) then
    raise exception 'encoding_tests_incomplete' using errcode = '22023';
  end if;

  update public.management_product_units units
  set status = target_status,
      iphone_test = case when target_status = 'tested' then target_iphone_test else units.iphone_test end,
      android_test = case when target_status = 'tested' then target_android_test else units.android_test end,
      qr_test = case when target_status = 'tested' then target_qr_test else units.qr_test end,
      encoded_by = case when target_status = 'encoded' then (select auth.uid()) else units.encoded_by end,
      tested_by = case when target_status = 'tested' then (select auth.uid()) else units.tested_by end,
      encoded_at = case when target_status = 'encoded' then now() else units.encoded_at end,
      tested_at = case when target_status = 'tested' then now() else units.tested_at end,
      locked_at = case when target_status = 'locked' then now() else units.locked_at end
  where units.id = target_product_unit_id
    and units.organization_id = target_organization_id
    and units.status = expected_status
  returning * into updated_unit;

  if updated_unit.id is null then
    raise exception 'management_product_unit_conflict' using errcode = '40001';
  end if;
  return updated_unit;
end;
$$;

create or replace function public.activate_management_order_pilot_as_service(
  target_actor_user_id uuid,
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
  platform_organization_id uuid;
  selected_order public.management_orders;
  selected_client public.management_clients;
  source_order public.orders;
  customer_email text;
  created_organization_id uuid;
  created_location_id uuid;
  created_product_id uuid;
  created_count integer := 0;
  assigned_count integer := 0;
  resolved_action_id text;
  activation_result record;
  unit_record record;
  unit_target_url text;
begin
  select settings.management_organization_id into platform_organization_id
  from public.platform_settings settings
  where settings.id = true;

  if platform_organization_id is null or not exists (
    select 1
    from public.organization_members memberships
    join public.management_profiles profiles
      on profiles.organization_id = memberships.organization_id
     and profiles.user_id = memberships.user_id
    where memberships.organization_id = platform_organization_id
      and memberships.user_id = target_actor_user_id
      and memberships.role in ('owner', 'admin', 'manager')
  ) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;

  select * into selected_order
  from public.management_orders orders
  where orders.id = target_management_order_id
    and orders.organization_id = platform_organization_id;
  if selected_order.id is null then
    raise exception 'management_order_not_found' using errcode = '22023';
  end if;
  if selected_order.status not in ('ready', 'shipped') then
    raise exception 'order_not_ready_for_pilot' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(target_location_name, ''))) not between 1 and 150 then
    raise exception 'valid_location_name_required' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(target_url, '')), '') is not null
    and (trim(target_url) !~ '^https://[^[:space:]]+$' or char_length(trim(target_url)) > 500) then
    raise exception 'valid_https_destination_required' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(selected_order.id::text, 0));
  select * into selected_order
  from public.management_orders orders
  where orders.id = target_management_order_id
  for update;

  if selected_order.pilot_organization_id is not null then
    return query
      select selected_order.pilot_organization_id,
        locations.id,
        count(products.id)::integer
      from public.locations locations
      left join public.tapote_products products
        on products.organization_id = locations.organization_id
      where locations.organization_id = selected_order.pilot_organization_id
      group by locations.id
      order by locations.created_at
      limit 1;
    return;
  end if;

  select * into selected_client
  from public.management_clients clients
  where clients.id = selected_order.client_id
    and clients.organization_id = selected_order.organization_id
    and clients.archived_at is null;
  if selected_client.id is null or nullif(trim(coalesce(selected_client.email, '')), '') is null then
    raise exception 'customer_email_required' using errcode = '22023';
  end if;

  select users.email into customer_email
  from auth.users users
  where users.id = target_customer_user_id;
  if customer_email is null or lower(customer_email) <> lower(selected_client.email) then
    raise exception 'customer_email_mismatch' using errcode = '22023';
  end if;

  select count(*)::integer into assigned_count
  from public.management_product_units units
  where units.organization_id = selected_order.organization_id
    and units.order_id = selected_order.id
    and units.client_id = selected_order.client_id
    and units.status = 'assigned';

  -- Paid storefront orders can still use the existing composition-based
  -- provisioner when workshop units have not been serialized yet.
  if assigned_count = 0 and selected_order.source_order_id is not null then
    select * into source_order
    from public.orders orders
    where orders.id = selected_order.source_order_id;
    if source_order.id is null then
      raise exception 'source_order_not_found' using errcode = '22023';
    end if;
    if not exists (
      select 1 from auth.users users
      where users.id = target_customer_user_id
        and users.email_confirmed_at is not null
    ) then
      raise exception 'customer_invitation_pending' using errcode = '22023';
    end if;

    perform set_config('request.jwt.claim.sub', target_actor_user_id::text, true);
    select * into activation_result
    from public.activate_customer_workspace(
      selected_order.id,
      target_customer_user_id,
      trim(target_location_name),
      nullif(trim(coalesce(target_url, '')), '')
    );
    update public.management_orders orders
      set pilot_status = 'active',
          pilot_organization_id = activation_result.organization_id,
          pilot_user_id = target_customer_user_id,
          pilot_activated_at = coalesce(orders.pilot_activated_at, now())
    where orders.id = selected_order.id;
    return query select activation_result.organization_id,
      activation_result.location_id,
      activation_result.products_created;
    return;
  end if;

  if assigned_count = 0 then
    raise exception 'assigned_products_required' using errcode = '22023';
  end if;

  insert into public.organizations(name, created_by)
  values (selected_client.name, target_customer_user_id)
  returning id into created_organization_id;

  insert into public.locations(organization_id, name)
  values (created_organization_id, trim(target_location_name))
  returning id into created_location_id;

  resolved_action_id := case
    when lower(coalesce(selected_order.destination, '')) like '%google%'
      or lower(coalesce(selected_order.destination, '')) like '%avis%' then 'avis'
    when lower(coalesce(selected_order.destination, '')) like '%menu%' then 'menu'
    when lower(coalesce(selected_order.destination, '')) like '%réserv%'
      or lower(coalesce(selected_order.destination, '')) like '%reserv%' then 'reservation'
    when lower(coalesce(selected_order.destination, '')) like '%instagram%' then 'instagram'
    when lower(coalesce(selected_order.destination, '')) like '%fidél%'
      or lower(coalesce(selected_order.destination, '')) like '%fidel%' then 'fidelite'
    when lower(coalesce(selected_order.destination, '')) like '%wi-fi%'
      or lower(coalesce(selected_order.destination, '')) like '%wifi%' then 'wifi'
    when lower(coalesce(selected_order.destination, '')) like '%pourboire%' then 'pourboire'
    else 'autre'
  end;

  for unit_record in
    select units.*, links.target_url
    from public.management_product_units units
    join public.tapote_links links on links.id = units.tapote_link_id
    where units.organization_id = selected_order.organization_id
      and units.order_id = selected_order.id
      and units.client_id = selected_order.client_id
      and units.status = 'assigned'
    order by units.created_at, units.id
    for update of units, links
  loop
    unit_target_url := coalesce(
      nullif(trim(coalesce(target_url, '')), ''),
      nullif(trim(coalesce(unit_record.target_url, '')), '')
    );
    if unit_target_url is null
      or unit_target_url !~ '^https://[^[:space:]]+$'
      or char_length(unit_target_url) > 500 then
      raise exception 'valid_https_destination_required' using errcode = '22023';
    end if;

    update public.tapote_links links
    set organization_id = created_organization_id,
        location_id = created_location_id,
        target_url = unit_target_url,
        active = true
    where links.id = unit_record.tapote_link_id;

    insert into public.tapote_products(
      organization_id, location_id, tapote_link_id,
      management_product_unit_id, product_type, action_id,
      label, serial_number, status, activated_at
    ) values (
      created_organization_id, created_location_id, unit_record.tapote_link_id,
      unit_record.id,
      case
        when lower(unit_record.support_type) like '%chevalet%'
          or lower(unit_record.support_type) like '%comptoir%' then 'comptoir'
        when lower(unit_record.support_type) like '%plaque%' then 'plaque'
        when lower(unit_record.support_type) like '%carte%' then 'carte'
        else left(lower(regexp_replace(unit_record.support_type, '[^[:alnum:]]+', '-', 'g')), 50)
      end,
      resolved_action_id,
      left(unit_record.label, 100), unit_record.serial_number,
      'active', now()
    ) returning id into created_product_id;
    created_count := created_count + 1;

    insert into public.audit_logs(
      organization_id, actor_user_id, action, entity_type, entity_id, changes
    ) values (
      created_organization_id, target_actor_user_id, 'tapote_product.activated',
      'tapote_product', created_product_id,
      jsonb_build_object(
        'management_order_id', selected_order.id,
        'management_product_unit_id', unit_record.id,
        'serial_number', unit_record.serial_number
      )
    );
  end loop;

  update public.management_orders orders
  set pilot_status = 'active',
      pilot_organization_id = created_organization_id,
      pilot_user_id = target_customer_user_id,
      pilot_activated_at = now()
  where orders.id = selected_order.id;

  insert into public.management_activity(
    organization_id, kind, description, metadata
  ) values (
    selected_order.organization_id,
    'system',
    'Espace Pilot activé pour ' || selected_client.name,
    jsonb_build_object(
      'management_order_id', selected_order.id,
      'customer_organization_id', created_organization_id,
      'products_created', created_count
    )
  );

  return query select created_organization_id, created_location_id, created_count;
end;
$$;

revoke all on function public.activate_management_order_pilot_as_service(uuid, uuid, uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.activate_management_order_pilot_as_service(uuid, uuid, uuid, text, text)
  to service_role;

comment on function public.assign_management_encoded_product(uuid, uuid, uuid, uuid) is
  'Affecte explicitement une unité verrouillée à la commande et au client Gestion correspondants.';
comment on function public.activate_management_order_pilot_as_service(uuid, uuid, uuid, text, text) is
  'Provisionne un espace Pilot client depuis une commande Gestion manuelle ou e-commerce, via backend uniquement.';

commit;
