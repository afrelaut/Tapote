-- Pont Tapote -> Jarvis en lecture agrégée uniquement.
-- À relire puis exécuter manuellement dans Supabase. Ce fichier n'est pas une
-- migration automatique et ne contient volontairement ni identifiant métier
-- ni secret.
begin;

create schema if not exists jarvis_read;
revoke all on schema jarvis_read from public, anon, authenticated;

create table if not exists jarvis_read.allowed_organizations (
  organization_id uuid primary key references public.organizations(id) on delete cascade
);
revoke all on jarvis_read.allowed_organizations from public, anon, authenticated;

-- Ajouter ici, pendant l'activation contrôlée, l'organisation Tapote autorisée :
-- insert into jarvis_read.allowed_organizations(organization_id)
-- values ('00000000-0000-0000-0000-000000000000');

create or replace view jarvis_read.management_summary
with (security_barrier = true) as
select orders.organization_id, orders.status, orders.payment_status,
       count(*)::bigint as order_count,
       coalesce(sum(orders.total_cents), 0)::bigint as total_cents,
       min(orders.due_on) filter (where orders.status not in ('shipped', 'cancelled')) as next_due_on
from public.management_orders orders
join jarvis_read.allowed_organizations allowed using (organization_id)
group by orders.organization_id, orders.status, orders.payment_status;

create or replace view jarvis_read.inventory_summary
with (security_barrier = true) as
select inventory.organization_id, inventory.category,
       count(*)::bigint as item_count,
       sum(inventory.stock_quantity)::bigint as stock_quantity,
       sum(inventory.reserved_quantity)::bigint as reserved_quantity,
       count(*) filter (
         where inventory.stock_quantity - inventory.reserved_quantity <= inventory.threshold_quantity
       )::bigint as low_stock_count
from public.management_inventory_items inventory
join jarvis_read.allowed_organizations allowed using (organization_id)
where inventory.archived_at is null
group by inventory.organization_id, inventory.category;

create or replace view jarvis_read.client_summary
with (security_barrier = true) as
select clients.organization_id, clients.health, clients.segment,
       count(*)::bigint as client_count
from public.management_clients clients
join jarvis_read.allowed_organizations allowed using (organization_id)
where clients.archived_at is null
group by clients.organization_id, clients.health, clients.segment;

create or replace view jarvis_read.pilot_summary
with (security_barrier = true) as
select products.organization_id, products.status, products.product_type,
       count(*)::bigint as product_count,
       max(products.activated_at) as last_activation_at
from public.tapote_products products
join jarvis_read.allowed_organizations allowed using (organization_id)
group by products.organization_id, products.status, products.product_type;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'jarvis_reader') then
    create role jarvis_reader nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
  end if;
end $$;

grant usage on schema jarvis_read to jarvis_reader;
grant select on jarvis_read.management_summary, jarvis_read.inventory_summary,
  jarvis_read.client_summary, jarvis_read.pilot_summary to jarvis_reader;
revoke all on jarvis_read.allowed_organizations from jarvis_reader;
revoke all on all tables in schema public from jarvis_reader;

commit;

-- Le rôle de DATABASE_URL doit pouvoir exécuter SET ROLE jarvis_reader.
-- Après identification explicite du rôle de connexion Tapote :
-- grant jarvis_reader to <role_api_tapote>;
-- select has_role('<role_api_tapote>', 'jarvis_reader', 'member');
--
-- L'API refuse la lecture si SET ROLE échoue. Ne jamais donner LOGIN à
-- jarvis_reader, ne jamais exposer DATABASE_URL et ne jamais employer la clé
-- Supabase service_role pour ce pont.
