-- Tapote Pilot beta: physical products, short links, aggregate metrics and audit.
-- Version aligned with the migration history of the connected Supabase project.

alter table public.tapote_links
  add column short_code text not null default substr(encode(gen_random_bytes(6), 'hex'), 1, 10);

alter table public.tapote_links
  add constraint tapote_links_short_code_format check (short_code ~ '^[a-f0-9]{10}$'),
  add constraint tapote_links_short_code_unique unique (short_code);

alter table public.locations
  add constraint locations_organization_id_id_unique unique (organization_id, id);
alter table public.tapote_links
  add constraint tapote_links_organization_id_id_unique unique (organization_id, id);

create table public.tapote_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid,
  tapote_link_id uuid not null unique,
  order_item_id uuid references public.order_items(id) on delete set null,
  product_type text not null check (char_length(product_type) between 1 and 50),
  action_id text not null check (char_length(action_id) between 1 and 50),
  label text not null check (char_length(label) between 1 and 100),
  serial_number text not null unique check (serial_number ~ '^TAP-[A-Z0-9-]{6,40}$'),
  status text not null default 'active' check (status in ('ready', 'active', 'paused', 'replaced')),
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tapote_products_location_organization_fkey
    foreign key (organization_id, location_id)
    references public.locations (organization_id, id) on delete restrict,
  constraint tapote_products_link_organization_fkey
    foreign key (organization_id, tapote_link_id)
    references public.tapote_links (organization_id, id) on delete restrict
);

create index tapote_products_org_status_idx
  on public.tapote_products (organization_id, status, created_at desc);
create index tapote_products_location_idx
  on public.tapote_products (location_id)
  where location_id is not null;
create index tapote_products_order_item_idx
  on public.tapote_products (order_item_id)
  where order_item_id is not null;

create trigger tapote_products_set_updated_at
before update on public.tapote_products
for each row execute function private.set_updated_at();

create or replace function private.audit_tapote_link_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.target_url is distinct from new.target_url or old.active is distinct from new.active then
    insert into public.audit_logs (
      organization_id,
      actor_user_id,
      action,
      entity_type,
      entity_id,
      changes
    ) values (
      new.organization_id,
      (select auth.uid()),
      'tapote_link.updated',
      'tapote_link',
      new.id,
      jsonb_build_object(
        'target_url', jsonb_build_object('from', old.target_url, 'to', new.target_url),
        'active', jsonb_build_object('from', old.active, 'to', new.active)
      )
    );
  end if;
  return new;
end;
$$;

revoke all on function private.audit_tapote_link_update() from public, anon, authenticated;

create trigger tapote_links_audit_after_update
after update on public.tapote_links
for each row execute function private.audit_tapote_link_update();

alter table public.tapote_products enable row level security;
revoke all on public.tapote_products from anon, authenticated;
grant select on public.tapote_products to authenticated;

create policy tapote_products_select on public.tapote_products
for select to authenticated
using ((select private.is_org_member(organization_id)));

-- Pilot beta is invitation-only. Customers can read their workspace and update
-- an existing destination, but provisioning stays server-side.
revoke insert, delete on public.organizations from authenticated;
revoke insert, update, delete on public.organization_members from authenticated;
revoke insert, update, delete on public.locations from authenticated;
revoke insert, delete on public.tapote_links from authenticated;

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
    and (select private.is_org_member(p_organization_id))
    and events.occurred_at >= greatest(p_since, now() - interval '400 days')
  group by 1, 2, 3
  order by 1 asc, 2 asc, 3 asc;
$$;

revoke all on function public.get_pilot_dashboard(uuid, timestamptz) from public, anon;
grant execute on function public.get_pilot_dashboard(uuid, timestamptz) to authenticated;
