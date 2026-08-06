-- Verrou Tapote Pilot Pro.
--
-- La formule n'existait nulle part : ni colonne, ni retour de RPC. Le client
-- retombait donc systématiquement sur le défaut permissif « pro » posé dans
-- pilotData.js, et le changement de destination à distance — facturé 9 €/mois —
-- était ouvert à tous les comptes.
--
-- La formule est portée par l'organisation, pas par le membre : une
-- souscription couvre l'établissement, pas chaque utilisateur invité.
-- Le défaut est « included », le niveau gratuit : le verrou échoue fermé.

alter table public.organizations
  add column if not exists pilot_plan text not null default 'included';

alter table public.organizations
  drop constraint if exists organizations_pilot_plan_check;
alter table public.organizations
  add constraint organizations_pilot_plan_check
  check (pilot_plan in ('included', 'pro'));

comment on column public.organizations.pilot_plan is
  'Niveau Tapote Pilot de l''organisation : included (offert avec le support) ou pro (option payante). Défaut fermé.';

-- Le RPC ne renvoyait que organization_id, role et created_at : la formule
-- doit voyager avec la souscription, sinon le client ne peut pas la vérifier.
create or replace function public.get_my_pilot_membership()
returns table (
  organization_id uuid,
  role text,
  created_at timestamptz,
  pilot_plan text
)
language sql
stable
security definer
set search_path = ''
as $$
  with pilot_memberships as (
    select
      memberships.organization_id,
      memberships.role,
      memberships.created_at,
      coalesce(organizations.pilot_plan, 'included') as pilot_plan
    from public.organization_members memberships
    join public.organizations organizations
      on organizations.id = memberships.organization_id
    where memberships.user_id = (select auth.uid())
      and not exists (
        select 1
        from public.platform_settings settings
        where settings.management_organization_id = memberships.organization_id
      )
  )
  select
    memberships.organization_id,
    memberships.role,
    memberships.created_at,
    memberships.pilot_plan
  from pilot_memberships memberships
  where (select count(*) from pilot_memberships) = 1;
$$;

revoke all on function public.get_my_pilot_membership() from public, anon;
grant execute on function public.get_my_pilot_membership() to authenticated;
