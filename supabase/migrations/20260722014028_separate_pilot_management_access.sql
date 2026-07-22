-- Pilot is customer-facing. Gestion is an internal operational product.
-- A membership must never grant access to both domains implicitly.

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
    join public.platform_settings settings
      on settings.management_organization_id = memberships.organization_id
    join public.management_profiles profiles
      on profiles.organization_id = memberships.organization_id
     and profiles.user_id = memberships.user_id
    where memberships.organization_id = target_organization_id
      and memberships.user_id = (select auth.uid())
      and memberships.role in ('owner', 'admin', 'manager')
  );
$$;

create or replace function private.is_pilot_member(target_organization_id uuid)
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
      and not exists (
        select 1
        from public.platform_settings settings
        where settings.management_organization_id = memberships.organization_id
      )
  );
$$;

create or replace function private.can_management_access_pilot_org(target_pilot_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_settings settings
    join public.organization_members memberships
      on memberships.organization_id = settings.management_organization_id
     and memberships.user_id = (select auth.uid())
     and memberships.role in ('owner', 'admin', 'manager')
    join public.management_profiles profiles
      on profiles.organization_id = memberships.organization_id
     and profiles.user_id = memberships.user_id
    join public.management_orders orders
      on orders.organization_id = settings.management_organization_id
     and orders.pilot_organization_id = target_pilot_organization_id
    where target_pilot_organization_id is not null
  );
$$;

create or replace function private.is_management_storage_member(target_organization_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members memberships
    join public.platform_settings settings
      on settings.management_organization_id = memberships.organization_id
    join public.management_profiles profiles
      on profiles.organization_id = memberships.organization_id
     and profiles.user_id = memberships.user_id
    where memberships.organization_id::text = target_organization_id
      and memberships.user_id = (select auth.uid())
      and memberships.role in ('owner', 'admin', 'manager')
  );
$$;

revoke all on function private.is_management_member(uuid) from public, anon;
revoke all on function private.is_pilot_member(uuid) from public, anon;
revoke all on function private.can_management_access_pilot_org(uuid) from public, anon;
revoke all on function private.is_management_storage_member(text) from public, anon;
grant execute on function private.is_management_member(uuid) to authenticated;
grant execute on function private.is_pilot_member(uuid) to authenticated;
grant execute on function private.can_management_access_pilot_org(uuid) to authenticated;
grant execute on function private.is_management_storage_member(text) to authenticated;

create or replace function public.get_my_pilot_membership()
returns table (
  organization_id uuid,
  role text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with pilot_memberships as (
    select memberships.organization_id, memberships.role, memberships.created_at
    from public.organization_members memberships
    where memberships.user_id = (select auth.uid())
      and not exists (
        select 1
        from public.platform_settings settings
        where settings.management_organization_id = memberships.organization_id
      )
  )
  select memberships.organization_id, memberships.role, memberships.created_at
  from pilot_memberships memberships
  where (select count(*) from pilot_memberships) = 1;
$$;

revoke all on function public.get_my_pilot_membership() from public, anon;
grant execute on function public.get_my_pilot_membership() to authenticated;

create or replace function public.get_my_management_pilot_organizations()
returns table (
  organization_id uuid,
  organization_name text,
  role text,
  last_linked_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pilot_organizations.id,
    pilot_organizations.name,
    memberships.role,
    max(coalesce(orders.pilot_activated_at, orders.updated_at, orders.created_at)) as last_linked_at
  from public.platform_settings settings
  join public.organization_members memberships
    on memberships.organization_id = settings.management_organization_id
   and memberships.user_id = (select auth.uid())
   and memberships.role in ('owner', 'admin', 'manager')
  join public.management_profiles profiles
    on profiles.organization_id = memberships.organization_id
   and profiles.user_id = memberships.user_id
  join public.management_orders orders
    on orders.organization_id = settings.management_organization_id
   and orders.pilot_organization_id is not null
  join public.organizations pilot_organizations
    on pilot_organizations.id = orders.pilot_organization_id
  group by pilot_organizations.id, pilot_organizations.name, memberships.role
  order by last_linked_at desc, pilot_organizations.name asc;
$$;

revoke all on function public.get_my_management_pilot_organizations() from public, anon;
grant execute on function public.get_my_management_pilot_organizations() to authenticated;

drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations for select to authenticated
using (
  (select private.is_pilot_member(id))
  or (select private.is_management_member(id))
  or (select private.can_management_access_pilot_org(id))
);

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations for update to authenticated
using (
  (
    (select private.is_pilot_member(id))
    and (select private.has_org_role(id, array['owner', 'admin']))
  )
  or (
    (select private.is_management_member(id))
    and (select private.has_org_role(id, array['owner', 'admin']))
  )
)
with check (
  (
    (select private.is_pilot_member(id))
    and (select private.has_org_role(id, array['owner', 'admin']))
  )
  or (
    (select private.is_management_member(id))
    and (select private.has_org_role(id, array['owner', 'admin']))
  )
);

drop policy if exists memberships_select on public.organization_members;
create policy memberships_select on public.organization_members for select to authenticated
using (
  (select private.is_pilot_member(organization_id))
  or (select private.is_management_member(organization_id))
);

drop policy if exists memberships_insert on public.organization_members;
create policy memberships_insert on public.organization_members for insert to authenticated
with check (
  (
    (select private.is_pilot_member(organization_id))
    and (select private.has_org_role(organization_id, array['owner']))
  )
  or (
    (select private.is_management_member(organization_id))
    and (select private.has_org_role(organization_id, array['owner']))
  )
);

drop policy if exists memberships_update on public.organization_members;
create policy memberships_update on public.organization_members for update to authenticated
using (
  (
    (select private.is_pilot_member(organization_id))
    and (select private.has_org_role(organization_id, array['owner']))
  )
  or (
    (select private.is_management_member(organization_id))
    and (select private.has_org_role(organization_id, array['owner']))
  )
)
with check (
  (
    (select private.is_pilot_member(organization_id))
    and (select private.has_org_role(organization_id, array['owner']))
  )
  or (
    (select private.is_management_member(organization_id))
    and (select private.has_org_role(organization_id, array['owner']))
  )
);

drop policy if exists memberships_delete on public.organization_members;
create policy memberships_delete on public.organization_members for delete to authenticated
using (
  user_id <> (select auth.uid())
  and (
    (
      (select private.is_pilot_member(organization_id))
      and (select private.has_org_role(organization_id, array['owner']))
    )
    or (
      (select private.is_management_member(organization_id))
      and (select private.has_org_role(organization_id, array['owner']))
    )
  )
);

drop policy if exists locations_select on public.locations;
create policy locations_select on public.locations for select to authenticated
using (
  (select private.is_pilot_member(organization_id))
  or (select private.can_management_access_pilot_org(organization_id))
);

drop policy if exists tapote_links_select on public.tapote_links;
create policy tapote_links_select on public.tapote_links for select to authenticated
using (
  (select private.is_pilot_member(organization_id))
  or (select private.can_management_access_pilot_org(organization_id))
);

drop policy if exists tapote_links_update on public.tapote_links;
create policy tapote_links_update on public.tapote_links for update to authenticated
using (
  (select private.is_pilot_member(organization_id))
  and (select private.has_org_role(organization_id, array['owner', 'admin', 'member']))
)
with check (
  (select private.is_pilot_member(organization_id))
  and (select private.has_org_role(organization_id, array['owner', 'admin', 'member']))
);

drop policy if exists tap_events_select on public.tap_events;
create policy tap_events_select on public.tap_events for select to authenticated
using (exists (
  select 1
  from public.tapote_links links
  where links.id = tap_events.tapote_link_id
    and (
      (select private.is_pilot_member(links.organization_id))
      or (select private.can_management_access_pilot_org(links.organization_id))
    )
));

drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select to authenticated
using (
  (select private.is_pilot_member(organization_id))
  or (select private.can_management_access_pilot_org(organization_id))
);

drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions for select to authenticated
using (
  (select private.is_pilot_member(organization_id))
  or (select private.can_management_access_pilot_org(organization_id))
);

drop policy if exists tapote_products_select on public.tapote_products;
create policy tapote_products_select on public.tapote_products for select to authenticated
using (
  (select private.is_pilot_member(organization_id))
  or (select private.can_management_access_pilot_org(organization_id))
);

drop policy if exists management_settings_insert on public.management_settings;
create policy management_settings_insert on public.management_settings for insert to authenticated
with check (
  (select private.is_management_member(organization_id))
  and (select private.has_org_role(organization_id, array['owner', 'admin']))
);

drop policy if exists management_settings_update on public.management_settings;
create policy management_settings_update on public.management_settings for update to authenticated
using (
  (select private.is_management_member(organization_id))
  and (select private.has_org_role(organization_id, array['owner', 'admin']))
)
with check (
  (select private.is_management_member(organization_id))
  and (select private.has_org_role(organization_id, array['owner', 'admin']))
);

drop policy if exists management_storage_select on storage.objects;
create policy management_storage_select on storage.objects for select to authenticated
using (
  bucket_id = 'tapote-management-private'
  and (select private.is_management_storage_member((storage.foldername(name))[1]))
);

drop policy if exists management_storage_insert on storage.objects;
create policy management_storage_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'tapote-management-private'
  and (select private.is_management_storage_member((storage.foldername(name))[1]))
);

drop policy if exists management_storage_update on storage.objects;
create policy management_storage_update on storage.objects for update to authenticated
using (
  bucket_id = 'tapote-management-private'
  and (select private.is_management_storage_member((storage.foldername(name))[1]))
)
with check (
  bucket_id = 'tapote-management-private'
  and (select private.is_management_storage_member((storage.foldername(name))[1]))
);

drop policy if exists management_storage_delete on storage.objects;
create policy management_storage_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'tapote-management-private'
  and (select private.is_management_storage_member((storage.foldername(name))[1]))
);

create or replace function public.get_pilot_dashboard(
  p_organization_id uuid,
  p_since timestamptz
)
returns table (
  day date,
  tapote_link_id uuid,
  source text,
  interactions bigint,
  last_interaction timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    (events.occurred_at at time zone 'Europe/Paris')::date as day,
    events.tapote_link_id,
    events.source,
    count(*)::bigint as interactions,
    max(events.occurred_at) as last_interaction
  from public.tap_events events
  join public.tapote_links links on links.id = events.tapote_link_id
  where links.organization_id = p_organization_id
    and (
      (select private.is_pilot_member(p_organization_id))
      or (select private.can_management_access_pilot_org(p_organization_id))
    )
    and events.occurred_at >= greatest(p_since, now() - interval '400 days')
  group by 1, 2, 3
  order by 1 asc, 2 asc, 3 asc;
$$;

revoke all on function public.get_pilot_dashboard(uuid, timestamptz) from public, anon;
grant execute on function public.get_pilot_dashboard(uuid, timestamptz) to authenticated;

comment on function private.is_pilot_member(uuid) is
  'Autorise exclusivement les espaces clients Pilot, jamais une organisation interne Gestion.';
comment on function private.is_management_member(uuid) is
  'Autorise Gestion uniquement avec un profil interne explicite et un rôle opérationnel.';
comment on function private.can_management_access_pilot_org(uuid) is
  'Autorise un opérateur Gestion à consulter uniquement un espace Pilot lié à une commande Gestion.';
comment on function public.get_my_pilot_membership() is
  'Retourne uniquement un espace client Pilot et exclut toujours l organisation interne Gestion.';
comment on function public.get_my_management_pilot_organizations() is
  'Liste pour Gestion les seuls espaces Pilot clients liés à ses commandes. Aucun droit inverse n est accordé.';
comment on function public.get_pilot_dashboard(uuid, timestamptz) is
  'Expose les donnees Pilot au client de l organisation ou a un profil Gestion explicite. Cet acces est unidirectionnel.';
