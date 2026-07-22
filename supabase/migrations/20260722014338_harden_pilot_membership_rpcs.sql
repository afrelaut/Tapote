-- The browser-facing RPCs obey RLS. Privileged membership checks stay in the
-- private schema and remain unavailable as REST endpoints.

create or replace function public.get_my_pilot_membership()
returns table (
  organization_id uuid,
  role text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with pilot_memberships as (
    select memberships.organization_id, memberships.role, memberships.created_at
    from public.organization_members memberships
    where memberships.user_id = (select auth.uid())
      and (select private.is_pilot_member(memberships.organization_id))
  )
  select memberships.organization_id, memberships.role, memberships.created_at
  from pilot_memberships memberships
  where (select count(*) from pilot_memberships) = 1;
$$;

create or replace function public.get_my_management_pilot_organizations()
returns table (
  organization_id uuid,
  organization_name text,
  role text,
  last_linked_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    pilot_organizations.id,
    pilot_organizations.name,
    memberships.role,
    max(coalesce(orders.pilot_activated_at, orders.updated_at, orders.created_at)) as last_linked_at
  from public.management_orders orders
  join public.organization_members memberships
    on memberships.organization_id = orders.organization_id
   and memberships.user_id = (select auth.uid())
   and memberships.role in ('owner', 'admin', 'manager')
  join public.organizations pilot_organizations
    on pilot_organizations.id = orders.pilot_organization_id
  where orders.pilot_organization_id is not null
    and (select private.is_management_member(orders.organization_id))
  group by pilot_organizations.id, pilot_organizations.name, memberships.role
  order by last_linked_at desc, pilot_organizations.name asc;
$$;

revoke all on function public.get_my_pilot_membership() from public, anon;
revoke all on function public.get_my_management_pilot_organizations() from public, anon;
grant execute on function public.get_my_pilot_membership() to authenticated;
grant execute on function public.get_my_management_pilot_organizations() to authenticated;

comment on function public.get_my_pilot_membership() is
  'Returns exactly one customer Pilot membership through caller RLS; ambiguous memberships fail closed.';
comment on function public.get_my_management_pilot_organizations() is
  'Lists only Pilot organizations linked to orders visible to an explicitly authorized Gestion operator.';
