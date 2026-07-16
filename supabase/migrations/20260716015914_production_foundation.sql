-- Fondation de production Tapote.
create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_token uuid not null unique,
  status text not null default 'pending' check (status in (
    'pending', 'demo', 'payment_pending', 'paid', 'payment_failed', 'expired',
    'in_production', 'shipped', 'delivered', 'refunded', 'disputed', 'cancelled'
  )),
  stripe_session_id text unique,
  payment_intent_id text unique,
  customer_business_name text not null,
  customer_email text not null,
  destination_url text,
  amount_total integer check (amount_total is null or amount_total >= 0),
  currency text,
  legal_version text not null,
  terms_accepted_at timestamptz not null,
  paid_at timestamptz,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  action_id text not null,
  quantity integer not null check (quantity between 1 and 50),
  unit_amount integer not null check (unit_amount > 0),
  customization jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.stripe_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  stripe_created_at timestamptz not null,
  processed_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  need text not null,
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.uploads (
  id uuid primary key,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  bytes integer not null check (bytes between 1 and 2097152),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.outbox_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('order_notification', 'lead_notification')),
  dedupe_key text not null unique,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_created_idx on public.orders(status, created_at desc);
create index orders_payment_intent_idx on public.orders(payment_intent_id) where payment_intent_id is not null;
create index order_items_order_idx on public.order_items(order_id);
create index leads_created_idx on public.leads(created_at desc);
create index uploads_created_idx on public.uploads(created_at desc) where deleted_at is null;
create index outbox_pending_idx on public.outbox_jobs(available_at, created_at) where status = 'pending';

-- Tables commerciales accessibles uniquement au backend PostgreSQL.
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.stripe_events enable row level security;
alter table public.leads enable row level security;
alter table public.uploads enable row level security;
alter table public.outbox_jobs enable row level security;
revoke all on public.orders, public.order_items, public.stripe_events, public.leads, public.uploads, public.outbox_jobs from anon, authenticated;

-- Fondation multi-tenant de Tapote Pilot. Elle reste fermée tant que l'interface
-- d'administration et l'authentification ne sont pas publiées.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  timezone text not null default 'Europe/Paris',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tapote_links (
  id uuid primary key default gen_random_uuid(),
  public_id uuid not null unique default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  label text not null,
  target_url text not null check (target_url ~ '^https://'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tap_events (
  id bigint generated always as identity primary key,
  tapote_link_id uuid not null references public.tapote_links(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  source text not null check (source in ('nfc', 'qr', 'unknown')),
  country_code text,
  device_family text
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'beta' check (status in ('beta', 'trialing', 'active', 'past_due', 'cancelled', 'unpaid')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organization_members_user_idx on public.organization_members(user_id, organization_id);
create index locations_org_idx on public.locations(organization_id);
create index tapote_links_org_idx on public.tapote_links(organization_id);
create index tapote_links_location_idx on public.tapote_links(location_id);
create index tap_events_link_time_idx on public.tap_events(tapote_link_id, occurred_at desc);
create index audit_logs_org_time_idx on public.audit_logs(organization_id, created_at desc);

create or replace function private.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members memberships
    where memberships.organization_id = target_organization_id
      and memberships.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_org_role(target_organization_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members memberships
    where memberships.organization_id = target_organization_id
      and memberships.user_id = (select auth.uid())
      and memberships.role = any(allowed_roles)
  );
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.has_org_role(uuid, text[]) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, text[]) to authenticated;

create or replace function private.add_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;
revoke all on function private.add_organization_owner() from public, anon, authenticated;

create trigger organization_owner_after_insert
after insert on public.organizations
for each row execute function private.add_organization_owner();

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at before update on public.orders for each row execute function private.set_updated_at();
create trigger outbox_set_updated_at before update on public.outbox_jobs for each row execute function private.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations for each row execute function private.set_updated_at();
create trigger locations_set_updated_at before update on public.locations for each row execute function private.set_updated_at();
create trigger tapote_links_set_updated_at before update on public.tapote_links for each row execute function private.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions for each row execute function private.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.locations enable row level security;
alter table public.tapote_links enable row level security;
alter table public.tap_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.subscriptions enable row level security;

revoke all on public.organizations, public.organization_members, public.locations, public.tapote_links, public.tap_events, public.audit_logs, public.subscriptions from anon;
grant select, insert, update, delete on public.organizations, public.organization_members, public.locations, public.tapote_links to authenticated;
grant select on public.tap_events, public.audit_logs, public.subscriptions to authenticated;

create policy organizations_select on public.organizations for select to authenticated
using ((select private.is_org_member(id)));
create policy organizations_insert on public.organizations for insert to authenticated
with check (created_by = (select auth.uid()));
create policy organizations_update on public.organizations for update to authenticated
using ((select private.has_org_role(id, array['owner', 'admin'])))
with check ((select private.has_org_role(id, array['owner', 'admin'])));

create policy memberships_select on public.organization_members for select to authenticated
using ((select private.is_org_member(organization_id)));
create policy memberships_insert on public.organization_members for insert to authenticated
with check ((select private.has_org_role(organization_id, array['owner'])));
create policy memberships_update on public.organization_members for update to authenticated
using ((select private.has_org_role(organization_id, array['owner'])))
with check ((select private.has_org_role(organization_id, array['owner'])));
create policy memberships_delete on public.organization_members for delete to authenticated
using ((select private.has_org_role(organization_id, array['owner'])) and user_id <> (select auth.uid()));

create policy locations_select on public.locations for select to authenticated
using ((select private.is_org_member(organization_id)));
create policy locations_insert on public.locations for insert to authenticated
with check ((select private.has_org_role(organization_id, array['owner', 'admin', 'member'])));
create policy locations_update on public.locations for update to authenticated
using ((select private.has_org_role(organization_id, array['owner', 'admin', 'member'])))
with check ((select private.has_org_role(organization_id, array['owner', 'admin', 'member'])));
create policy locations_delete on public.locations for delete to authenticated
using ((select private.has_org_role(organization_id, array['owner', 'admin'])));

create policy tapote_links_select on public.tapote_links for select to authenticated
using ((select private.is_org_member(organization_id)));
create policy tapote_links_insert on public.tapote_links for insert to authenticated
with check ((select private.has_org_role(organization_id, array['owner', 'admin', 'member'])));
create policy tapote_links_update on public.tapote_links for update to authenticated
using ((select private.has_org_role(organization_id, array['owner', 'admin', 'member'])))
with check ((select private.has_org_role(organization_id, array['owner', 'admin', 'member'])));
create policy tapote_links_delete on public.tapote_links for delete to authenticated
using ((select private.has_org_role(organization_id, array['owner', 'admin'])));

create policy tap_events_select on public.tap_events for select to authenticated
using (exists (
  select 1 from public.tapote_links links
  where links.id = tap_events.tapote_link_id
    and (select private.is_org_member(links.organization_id))
));
create policy audit_logs_select on public.audit_logs for select to authenticated
using ((select private.is_org_member(organization_id)));
create policy subscriptions_select on public.subscriptions for select to authenticated
using ((select private.is_org_member(organization_id)));
