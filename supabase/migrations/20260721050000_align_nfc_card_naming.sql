begin;

update public.management_storefront_products
set name = case external_product_id
  when 'carte_standard' then 'La Carte NFC · Prête à l’emploi'
  when 'carte' then 'La Carte NFC'
  when 'carte_assortie' then 'La Carte NFC assortie'
  else name
end
where external_product_id in ('carte_standard', 'carte', 'carte_assortie');

-- Keep operational and Stripe summaries aligned with the customer-facing name.
create or replace function private.storefront_product_name(product_id text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case product_id
    when 'plaque_standard' then 'La Plaque 12 × 12 · Prête à l’emploi'
    when 'plaque' then 'La Plaque 12 × 12'
    when 'comptoir_standard' then 'Le Chevalet A6 · Prêt à l’emploi'
    when 'comptoir' then 'Le Chevalet A6'
    when 'carte_standard' then 'La Carte NFC · Prête à l’emploi'
    when 'carte' then 'La Carte NFC'
    when 'pack_duo_standard' then '2 supports · Prêts à l’emploi'
    when 'pack_duo' then '2 supports'
    when 'pack_cinq_standard' then '5 supports · Prêts à l’emploi'
    when 'pack_cinq' then '5 supports'
    when 'carte_assortie' then 'La Carte NFC assortie'
    -- Historical mappings remain intentionally supported for paid orders.
    when 'table6' then 'Les Chevalets A6 ×6'
    when 'sticker' then 'La Vitrine'
    when 'mini' then 'Le Mini Comptoir'
    when 'pack_essentiel' then 'Pack Essentiel'
    when 'pack_visibilite' then 'Pack Visibilité'
    when 'pack_commerce' then 'Pack Commerce'
    when 'pack_restaurant' then 'Pack Restaurant (alias)'
    when 'pack_resto' then 'Pack Restaurant'
    when 'pack_salon' then 'Pack Salon'
    when 'pack_equipe' then 'Pack Équipe'
    else left(product_id, 160)
  end;
$$;

revoke all on function private.storefront_product_name(text)
  from public, anon, authenticated, service_role;

commit;
