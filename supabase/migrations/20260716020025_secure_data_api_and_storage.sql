-- Tapote production hardening (migration history aligned with Supabase).
-- Data API objects are opt-in and customer artwork stays in a private bucket.

-- Supabase stopped exposing new public objects automatically in 2026. Make the
-- intended model explicit so future migrations cannot silently widen the API.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;

revoke create on schema public from public, anon, authenticated;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- Keep the only browser-facing RPC explicit after revoking function defaults.
revoke all on function public.get_pilot_dashboard(uuid, timestamptz) from public, anon;
grant execute on function public.get_pilot_dashboard(uuid, timestamptz) to authenticated;

-- Commercial records remain server-only. The Node API connects directly to
-- Postgres; no customer, anonymous client or browser SDK can query them.
revoke all on table
  public.orders,
  public.order_items,
  public.stripe_events,
  public.leads,
  public.uploads,
  public.outbox_jobs
from anon, authenticated;

-- Database-level validation mirrors the API contracts, providing a final
-- boundary if a future worker writes directly to Postgres.
alter table public.orders
  add constraint orders_business_name_length
    check (char_length(customer_business_name) between 1 and 100) not valid,
  add constraint orders_email_length
    check (char_length(customer_email) between 3 and 150) not valid,
  add constraint orders_destination_https
    check (
      destination_url is null
      or (char_length(destination_url) <= 500 and destination_url ~ '^https://')
    ) not valid;

alter table public.leads
  add constraint leads_name_length
    check (char_length(name) between 1 and 100) not valid,
  add constraint leads_email_length
    check (char_length(email) between 3 and 150) not valid,
  add constraint leads_company_length
    check (company is null or char_length(company) <= 150) not valid,
  add constraint leads_need_length
    check (char_length(need) between 1 and 1500) not valid;

alter table public.uploads
  add constraint uploads_original_name_length
    check (char_length(original_name) between 1 and 255) not valid;

alter table public.orders validate constraint orders_business_name_length;
alter table public.orders validate constraint orders_email_length;
alter table public.orders validate constraint orders_destination_https;
alter table public.leads validate constraint leads_name_length;
alter table public.leads validate constraint leads_email_length;
alter table public.leads validate constraint leads_company_length;
alter table public.leads validate constraint leads_need_length;
alter table public.uploads validate constraint uploads_original_name_length;

-- Private, server-only storage for customer logos and artwork. No policy is
-- added on storage.objects: the backend secret key is the sole access path.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'tapote-order-assets',
  'tapote-order-assets',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.orders is 'Commandes Tapote. Accès exclusif au backend.';
comment on table public.leads is 'Demandes commerciales Tapote. Accès exclusif au backend.';
comment on table public.tapote_products is 'Supports physiques rattachés aux espaces clients Pilot.';
comment on table public.tap_events is 'Interactions NFC/QR sans conservation d’adresse IP brute.';
