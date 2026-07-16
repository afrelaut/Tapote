-- Remote migration version: 20260716032846.
-- Removes browser-callable SECURITY DEFINER RPCs while keeping the integration
-- status visible through the already RLS-protected management order row.

alter table public.management_orders
  add column pilot_status text check (pilot_status is null or pilot_status in (
    'paid', 'in_production', 'ready_for_activation', 'active',
    'shipped', 'cancelled', 'failed'
  )),
  add column pilot_organization_id uuid
    references public.organizations(id) on delete restrict,
  add column pilot_user_id uuid
    references auth.users(id) on delete restrict,
  add column pilot_activated_at timestamptz;

create index management_orders_pilot_org_idx
  on public.management_orders(pilot_organization_id)
  where pilot_organization_id is not null;
create index management_orders_pilot_user_idx
  on public.management_orders(pilot_user_id)
  where pilot_user_id is not null;
create index order_provisioning_customer_user_idx
  on public.order_provisioning(customer_user_id)
  where customer_user_id is not null;

update public.management_orders orders
set pilot_status = provisioning.status,
  pilot_organization_id = provisioning.customer_organization_id,
  pilot_user_id = provisioning.customer_user_id,
  pilot_activated_at = provisioning.activated_at
from public.order_provisioning provisioning
where provisioning.management_order_id = orders.id;

create or replace function private.mirror_provisioning_to_management()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.management_order_id is not null then
    update public.management_orders orders
      set pilot_status = new.status,
        pilot_organization_id = new.customer_organization_id,
        pilot_user_id = new.customer_user_id,
        pilot_activated_at = new.activated_at
    where orders.id = new.management_order_id
      and (
        orders.pilot_status is distinct from new.status
        or orders.pilot_organization_id is distinct from new.customer_organization_id
        or orders.pilot_user_id is distinct from new.customer_user_id
        or orders.pilot_activated_at is distinct from new.activated_at
      );
  end if;
  return new;
end;
$$;
revoke all on function private.mirror_provisioning_to_management()
  from public, anon, authenticated, service_role;

create trigger order_provisioning_mirror_after_write
after insert or update on public.order_provisioning
for each row execute function private.mirror_provisioning_to_management();

drop function public.get_management_integrations(uuid);

-- Workspace activation crosses tenant boundaries by design and therefore runs
-- only through a trusted backend secret. The wrapper validates the real human
-- operator, establishes their auth context transaction-locally, then calls the
-- idempotent activation routine created by the previous migration.
revoke all on function public.activate_customer_workspace(uuid, uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.activate_customer_workspace(uuid, uuid, text, text)
  to service_role;

create or replace function public.activate_customer_workspace_as_service(
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
begin
  select settings.management_organization_id
    into platform_organization_id
  from public.platform_settings settings
  where settings.id = true;

  if platform_organization_id is null or not exists (
    select 1
    from public.organization_members memberships
    where memberships.organization_id = platform_organization_id
      and memberships.user_id = target_actor_user_id
      and memberships.role in ('owner', 'admin', 'manager')
  ) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;

  perform set_config('request.jwt.claim.sub', target_actor_user_id::text, true);
  return query
    select activation.organization_id, activation.location_id, activation.products_created
    from public.activate_customer_workspace(
      target_management_order_id,
      target_customer_user_id,
      target_location_name,
      target_url
    ) activation;
end;
$$;
revoke all on function public.activate_customer_workspace_as_service(uuid, uuid, uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.activate_customer_workspace_as_service(uuid, uuid, uuid, text, text)
  to service_role;

comment on function public.activate_customer_workspace_as_service(uuid, uuid, uuid, text, text) is
  'Activation Pilot réservée au backend après validation d un opérateur Gestion.';

drop index if exists public.management_orders_source_idx;
