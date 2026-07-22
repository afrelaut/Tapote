begin;

-- Seed the canonical storefront into the production Gestion organization.
-- The platform organization may be changed after initial catalog migrations,
-- so this intentionally resolves it at execution time and remains idempotent.
with platform_org as (
  select management_organization_id as organization_id
  from public.platform_settings
  where id = true and management_organization_id is not null
), catalog(external_product_id, name, price_cents) as (
  values
    ('plaque_standard', 'La Plaque 12 × 12 · Prête à l’emploi', 2900),
    ('plaque', 'La Plaque 12 × 12', 3900),
    ('comptoir_standard', 'Le Chevalet A6 · Prêt à l’emploi', 2900),
    ('comptoir', 'Le Chevalet A6', 3900),
    ('carte_standard', 'La Carte NFC · Prête à l’emploi', 1900),
    ('carte', 'La Carte NFC', 2900),
    ('pack_duo_standard', '2 supports · Prêts à l’emploi', 5500),
    ('pack_duo', '2 supports', 6900),
    ('pack_cinq_standard', '5 supports · Prêts à l’emploi', 8900),
    ('pack_cinq', '5 supports', 10900),
    ('carte_assortie', 'La Carte NFC assortie', 1900)
)
insert into public.management_storefront_products(
  organization_id, external_product_id, name, price_cents, online
)
select platform_org.organization_id, catalog.external_product_id,
  catalog.name, catalog.price_cents, true
from platform_org cross join catalog
where not exists (
  select 1 from public.management_storefront_products existing
  where existing.organization_id = platform_org.organization_id
    and existing.external_product_id = catalog.external_product_id
);

commit;
