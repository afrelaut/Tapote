begin;

create table public.management_product_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_id uuid references public.management_orders(id) on delete set null,
  client_id uuid references public.management_clients(id) on delete set null,
  tapote_link_id uuid not null unique references public.tapote_links(id) on delete restrict,
  serial_number text not null unique,
  support_type text not null check (char_length(support_type) between 2 and 80),
  chip_type text not null check (char_length(chip_type) between 2 and 80),
  chip_batch text check (chip_batch is null or char_length(chip_batch) <= 80),
  label text not null check (char_length(label) between 2 and 120),
  status text not null default 'draft'
    check (status in ('draft', 'encoded', 'tested', 'locked', 'assigned', 'replaced')),
  iphone_test boolean not null default false,
  android_test boolean not null default false,
  qr_test boolean not null default false,
  encoded_by uuid references auth.users(id) on delete set null,
  tested_by uuid references auth.users(id) on delete set null,
  encoded_at timestamptz,
  tested_at timestamptz,
  locked_at timestamptz,
  notes text check (notes is null or char_length(notes) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint management_product_units_serial_format
    check (serial_number ~ '^TAP-[A-Z0-9-]{6,40}$')
);

create index management_product_units_org_status_idx
  on public.management_product_units(organization_id, status, created_at desc);
create index management_product_units_order_idx
  on public.management_product_units(order_id) where order_id is not null;
create index management_product_units_client_idx
  on public.management_product_units(client_id) where client_id is not null;

create trigger management_product_units_updated_at
before update on public.management_product_units
for each row execute function private.set_updated_at();

create trigger management_product_units_audit
after insert or update or delete on public.management_product_units
for each row execute function private.audit_management_change();

alter table public.management_product_units enable row level security;

revoke all on table public.management_product_units from public, anon, authenticated;
grant select on table public.management_product_units to authenticated;
grant all on table public.management_product_units to service_role;

create policy management_product_units_select
on public.management_product_units for select to authenticated
using ((select private.is_management_member(organization_id)));

create or replace function public.create_management_encoded_product(
  target_organization_id uuid,
  target_order_id uuid,
  target_client_id uuid,
  target_support_type text,
  target_chip_type text,
  target_chip_batch text,
  target_label text,
  target_url text,
  target_notes text default null
)
returns public.management_product_units
language plpgsql
security definer
set search_path = ''
as $$
declare
  created_link public.tapote_links;
  created_unit public.management_product_units;
  resolved_client_id uuid := target_client_id;
  order_client_id uuid;
  serial_value text;
begin
  if (select auth.uid()) is null or not (select private.is_management_member(target_organization_id)) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;
  if target_url is null or target_url !~ '^https://[^[:space:]]+$' or char_length(target_url) > 2048 then
    raise exception 'invalid_target_url' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(target_label, ''))) < 2 then
    raise exception 'invalid_product_label' using errcode = '22023';
  end if;

  if target_order_id is not null then
    select orders.client_id into order_client_id
    from public.management_orders orders
    where orders.id = target_order_id and orders.organization_id = target_organization_id;
    if not found then
      raise exception 'invalid_management_order' using errcode = '22023';
    end if;
    resolved_client_id := coalesce(resolved_client_id, order_client_id);
    if order_client_id is distinct from resolved_client_id then
      raise exception 'invalid_client_order_pair' using errcode = '22023';
    end if;
  end if;

  if resolved_client_id is not null and not exists (
    select 1 from public.management_clients clients
    where clients.id = resolved_client_id and clients.organization_id = target_organization_id
  ) then
    raise exception 'invalid_management_client' using errcode = '22023';
  end if;

  insert into public.tapote_links (organization_id, label, target_url, active)
  values (target_organization_id, trim(target_label), target_url, true)
  returning * into created_link;

  serial_value := 'TAP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  insert into public.management_product_units (
    organization_id, order_id, client_id, tapote_link_id, serial_number,
    support_type, chip_type, chip_batch, label, notes
  ) values (
    target_organization_id, target_order_id, resolved_client_id, created_link.id, serial_value,
    trim(target_support_type), trim(target_chip_type), nullif(trim(target_chip_batch), ''),
    trim(target_label), nullif(trim(target_notes), '')
  ) returning * into created_unit;

  return created_unit;
end;
$$;

revoke all on function public.create_management_encoded_product(uuid, uuid, uuid, text, text, text, text, text, text)
  from public, anon;
grant execute on function public.create_management_encoded_product(uuid, uuid, uuid, text, text, text, text, text, text)
  to authenticated, service_role;

create or replace function public.advance_management_encoded_product(
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
  if (select auth.uid()) is null or not (select private.is_management_member(target_organization_id)) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;
  if not (
    (expected_status = 'draft' and target_status = 'encoded') or
    (expected_status = 'encoded' and target_status = 'tested') or
    (expected_status = 'tested' and target_status = 'locked') or
    (expected_status = 'locked' and target_status = 'assigned')
  ) then
    raise exception 'invalid_encoding_transition' using errcode = '22023';
  end if;
  if target_status = 'tested' and not (
    target_iphone_test and target_android_test and target_qr_test
  ) then
    raise exception 'encoding_tests_incomplete' using errcode = '22023';
  end if;

  update public.management_product_units units
  set
    status = target_status,
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

revoke all on function public.advance_management_encoded_product(uuid, uuid, text, text, boolean, boolean, boolean)
  from public, anon;
grant execute on function public.advance_management_encoded_product(uuid, uuid, text, text, boolean, boolean, boolean)
  to authenticated, service_role;

comment on table public.management_product_units is
  'Registre atelier unitaire : sérialisation, encodage NFC, tests QR/NFC et affectation.';
comment on column public.management_product_units.status is
  'Flux irréversible draft -> encoded -> tested -> locked -> assigned.';

commit;
