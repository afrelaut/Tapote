-- The platform singleton must reference the production Gestion organization,
-- never the isolated demonstration workspace.
do $$
declare
  production_management_organization_id uuid;
begin
  select organizations.id
  into strict production_management_organization_id
  from public.organizations organizations
  where organizations.name = 'TAPOTE Gestion'
    and exists (
      select 1
      from public.management_profiles profiles
      join public.organization_members memberships
        on memberships.organization_id = profiles.organization_id
       and memberships.user_id = profiles.user_id
       and memberships.role in ('owner', 'admin', 'manager')
      where profiles.organization_id = organizations.id
    );

  update public.platform_settings
  set management_organization_id = production_management_organization_id,
      updated_at = now()
  where id = true;

  if not found then
    raise exception 'The platform settings singleton is missing';
  end if;
end;
$$;
