-- Tapote Pilot SaaS hardening: least-privilege browser access and bounded data.
-- Remote migration version: 20260716023737.

-- Supabase projects created before the 2026 Data API default change may have
-- inherited broad table privileges. Reset every Pilot-facing object before
-- granting only the operations used by the client application.
revoke all privileges on table
  public.organizations,
  public.organization_members,
  public.locations,
  public.tapote_links,
  public.tap_events,
  public.audit_logs,
  public.subscriptions,
  public.tapote_products
from anon, authenticated;

revoke all privileges on all sequences in schema public from anon, authenticated;

grant select on table
  public.organizations,
  public.organization_members,
  public.locations,
  public.tapote_links,
  public.tap_events,
  public.audit_logs,
  public.subscriptions,
  public.tapote_products
to authenticated;

-- Customers may change only the destination or pause an existing link. They
-- cannot rename, move, reprovision or replace a physical product in-browser.
grant update (target_url, active) on table public.tapote_links to authenticated;

-- Bound all customer-controlled and operational text at the database edge.
alter table public.organizations
  add constraint organizations_name_length
    check (char_length(name) between 1 and 150) not valid;

alter table public.locations
  add constraint locations_name_length
    check (char_length(name) between 1 and 150) not valid,
  add constraint locations_address_length
    check (address is null or char_length(address) <= 500) not valid,
  add constraint locations_timezone_length
    check (char_length(timezone) between 1 and 100) not valid;

alter table public.tapote_links
  add constraint tapote_links_label_length
    check (char_length(label) between 1 and 100) not valid,
  add constraint tapote_links_target_url_length
    check (char_length(target_url) between 9 and 500) not valid;

alter table public.tap_events
  add constraint tap_events_country_code_format
    check (country_code is null or country_code ~ '^[A-Z]{2}$') not valid,
  add constraint tap_events_device_family_length
    check (device_family is null or char_length(device_family) between 1 and 50) not valid;

alter table public.audit_logs
  add constraint audit_logs_action_length
    check (char_length(action) between 1 and 100) not valid,
  add constraint audit_logs_entity_type_length
    check (char_length(entity_type) between 1 and 100) not valid;

alter table public.organizations validate constraint organizations_name_length;
alter table public.locations validate constraint locations_name_length;
alter table public.locations validate constraint locations_address_length;
alter table public.locations validate constraint locations_timezone_length;
alter table public.tapote_links validate constraint tapote_links_label_length;
alter table public.tapote_links validate constraint tapote_links_target_url_length;
alter table public.tap_events validate constraint tap_events_country_code_format;
alter table public.tap_events validate constraint tap_events_device_family_length;
alter table public.audit_logs validate constraint audit_logs_action_length;
alter table public.audit_logs validate constraint audit_logs_entity_type_length;

comment on column public.tapote_links.target_url is
  'Destination HTTPS modifiable par les membres autorisés dans Tapote Pilot.';
comment on column public.tapote_links.short_code is
  'Identifiant public permanent, non modifiable depuis le navigateur.';
