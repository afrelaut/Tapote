-- Resolve actionable Supabase advisors while keeping server-only tables closed.
-- Version aligned with the connected project's migration history.

create policy deny_browser_access on public.orders
for all to anon, authenticated
using (false)
with check (false);

create policy deny_browser_access on public.order_items
for all to anon, authenticated
using (false)
with check (false);

create policy deny_browser_access on public.stripe_events
for all to anon, authenticated
using (false)
with check (false);

create policy deny_browser_access on public.leads
for all to anon, authenticated
using (false)
with check (false);

create policy deny_browser_access on public.uploads
for all to anon, authenticated
using (false)
with check (false);

create policy deny_browser_access on public.outbox_jobs
for all to anon, authenticated
using (false)
with check (false);

create index audit_logs_actor_user_idx
  on public.audit_logs (actor_user_id)
  where actor_user_id is not null;

create index organizations_created_by_idx
  on public.organizations (created_by);

create index tapote_products_org_link_idx
  on public.tapote_products (organization_id, tapote_link_id);

create index tapote_products_org_location_idx
  on public.tapote_products (organization_id, location_id)
  where location_id is not null;
