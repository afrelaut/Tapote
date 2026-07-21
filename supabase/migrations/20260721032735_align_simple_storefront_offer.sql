begin;

-- Keep legacy products available for paid-order history and fulfillment, but
-- remove them from the active management storefront.
update public.management_storefront_products
set online = false
where external_product_id in (
    'table6', 'sticker', 'mini', 'pack_essentiel', 'pack_visibilite',
    'pack_commerce', 'pack_restaurant', 'pack_resto', 'pack_salon', 'pack_equipe'
  )
  or name in (
    'Les Chevalets A6 ×6', 'Chevalets A6 ×6', 'La Vitrine', 'Vitrine NFC',
    'Sticker NFC', 'La Vitrine · packs uniquement', 'Le Mini Comptoir',
    'Mini Comptoir', 'Pack Essentiel', 'Pack Visibilité', 'Pack Commerce',
    'Pack Restaurant', 'Pack Restaurant ×6', 'Pack Salon', 'Pack Équipe'
  );

with catalog (product_id, aliases, product_name, price_cents) as (
  values
    ('plaque_standard', array['La Plaque 12 × 12 · Prête à l’emploi'], 'La Plaque 12 × 12 · Prête à l’emploi', 2900),
    ('plaque', array['La Plaque 12 × 12', 'Plaque 12 × 12'], 'La Plaque 12 × 12', 3900),
    ('comptoir_standard', array['Le Chevalet A6 · Prêt à l’emploi'], 'Le Chevalet A6 · Prêt à l’emploi', 2900),
    ('comptoir', array['Le Chevalet A6', 'Le Comptoir A6', 'Comptoir A6'], 'Le Chevalet A6', 3900),
    ('carte_standard', array['La Carte · Prête à l’emploi'], 'La Carte · Prête à l’emploi', 1900),
    ('carte', array['La Carte', 'Carte NFC'], 'La Carte', 2900),
    ('pack_duo_standard', array['2 supports · Prêts à l’emploi'], '2 supports · Prêts à l’emploi', 5500),
    ('pack_duo', array['2 supports'], '2 supports', 6900),
    ('pack_cinq_standard', array['5 supports · Prêts à l’emploi'], '5 supports · Prêts à l’emploi', 8900),
    ('pack_cinq', array['5 supports'], '5 supports', 10900),
    ('carte_assortie', array['La Carte assortie'], 'La Carte assortie', 1900)
)
update public.management_storefront_products as product
set
  external_product_id = catalog.product_id,
  name = catalog.product_name,
  price_cents = catalog.price_cents,
  online = true
from catalog
where product.external_product_id = catalog.product_id
   or product.name = any(catalog.aliases);

with catalog (product_id, product_name, price_cents, physical_type) as (
  values
    ('plaque_standard', 'La Plaque 12 × 12 · Prête à l’emploi', 2900, 'plaque'),
    ('plaque', 'La Plaque 12 × 12', 3900, 'plaque'),
    ('comptoir_standard', 'Le Chevalet A6 · Prêt à l’emploi', 2900, 'comptoir'),
    ('comptoir', 'Le Chevalet A6', 3900, 'comptoir'),
    ('carte_standard', 'La Carte · Prête à l’emploi', 1900, 'carte'),
    ('carte', 'La Carte', 2900, 'carte'),
    ('pack_duo_standard', '2 supports · Prêts à l’emploi', 5500, 'pack'),
    ('pack_duo', '2 supports', 6900, 'pack'),
    ('pack_cinq_standard', '5 supports · Prêts à l’emploi', 8900, 'pack'),
    ('pack_cinq', '5 supports', 10900, 'pack'),
    ('carte_assortie', 'La Carte assortie', 1900, 'carte')
), management_organizations as (
  select distinct products.organization_id
  from public.management_storefront_products products
  union
  select settings.management_organization_id
  from public.platform_settings settings
  where settings.id = true
    and settings.management_organization_id is not null
)
insert into public.management_storefront_products (
  organization_id, inventory_item_id, external_product_id,
  name, price_cents, online
)
select
  organizations.organization_id,
  inventory.id,
  catalog.product_id,
  catalog.product_name,
  catalog.price_cents,
  true
from management_organizations organizations
cross join catalog
left join lateral (
  select items.id
  from public.management_inventory_items items
  where items.organization_id = organizations.organization_id
    and items.archived_at is null
    and (
      (catalog.physical_type = 'comptoir' and items.sku = 'SUP-A6-CLR')
      or (catalog.physical_type = 'plaque' and items.sku = 'PLAQUE-PVC-12')
      or (catalog.physical_type = 'carte' and items.sku = 'CARD-PVC-W')
      or (catalog.physical_type = 'pack' and items.sku like 'NFC-%')
    )
  order by
    case
      when catalog.physical_type = 'comptoir' and items.sku = 'SUP-A6-CLR' then 0
      when catalog.physical_type = 'plaque' and items.sku = 'PLAQUE-PVC-12' then 0
      when catalog.physical_type = 'carte' and items.sku = 'CARD-PVC-W' then 0
      else 1
    end,
    items.created_at
  limit 1
) inventory on true
where not exists (
  select 1
  from public.management_storefront_products existing
  where existing.organization_id = organizations.organization_id
    and existing.external_product_id = catalog.product_id
);

-- Human-readable names for both current and legacy order summaries.
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
    when 'carte_standard' then 'La Carte · Prête à l’emploi'
    when 'carte' then 'La Carte'
    when 'pack_duo_standard' then '2 supports · Prêts à l’emploi'
    when 'pack_duo' then '2 supports'
    when 'pack_cinq_standard' then '5 supports · Prêts à l’emploi'
    when 'pack_cinq' then '5 supports'
    when 'carte_assortie' then 'La Carte assortie'
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

-- Provision current packs from the exact composition saved by checkout. Ready
-- and custom SKUs intentionally create the same three physical product types.
-- Legacy branches are preserved so already-paid orders remain activatable.
create or replace function private.activate_customer_workspace(
  target_management_order_id uuid,
  target_customer_user_id uuid,
  target_location_name text default 'Établissement principal',
  target_url text default null
)
returns table (
  organization_id uuid,
  location_id uuid,
  products_created integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  management_order public.management_orders;
  source_order public.orders;
  existing_provisioning public.order_provisioning;
  customer_email text;
  created_organization_id uuid;
  created_location_id uuid;
  destination_url text;
  item record;
  purchase_index integer;
  unit_index integer;
  units_per_purchase integer;
  composition_comptoir integer;
  composition_plaque integer;
  physical_type text;
  product_label text;
  created_link_id uuid;
  created_count integer := 0;
begin
  select * into management_order
  from public.management_orders orders
  where orders.id = target_management_order_id;

  if management_order.id is null
    or not (select private.is_management_member(management_order.organization_id)) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;
  if management_order.organization_id is distinct from (
    select settings.management_organization_id
    from public.platform_settings settings where settings.id = true
  ) then
    raise exception 'platform_order_required' using errcode = '22023';
  end if;
  if management_order.source_order_id is null then
    raise exception 'storefront_order_required' using errcode = '22023';
  end if;

  select * into source_order
  from public.orders orders
  where orders.id = management_order.source_order_id;

  select users.email into customer_email
  from auth.users users
  where users.id = target_customer_user_id
    and users.email_confirmed_at is not null;
  if customer_email is null
    or lower(customer_email) <> lower(source_order.customer_email) then
    raise exception 'confirmed_customer_email_mismatch' using errcode = '22023';
  end if;

  destination_url := coalesce(nullif(target_url, ''), source_order.destination_url);
  if destination_url is null
    or destination_url !~ '^https://'
    or char_length(destination_url) > 500 then
    raise exception 'valid_https_destination_required' using errcode = '22023';
  end if;
  if char_length(trim(target_location_name)) not between 1 and 150 then
    raise exception 'valid_location_name_required' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(source_order.id::text, 0));
  select * into existing_provisioning
  from public.order_provisioning provisioning
  where provisioning.source_order_id = source_order.id
  for update;

  if existing_provisioning.customer_organization_id is not null then
    return query
      select existing_provisioning.customer_organization_id,
        locations.id,
        count(products.id)::integer
      from public.locations locations
      left join public.tapote_products products
        on products.organization_id = locations.organization_id
      where locations.organization_id = existing_provisioning.customer_organization_id
      group by locations.id
      order by locations.created_at
      limit 1;
    return;
  end if;

  insert into public.organizations(name, created_by)
  values (source_order.customer_business_name, target_customer_user_id)
  returning id into created_organization_id;

  insert into public.locations(organization_id, name)
  values (created_organization_id, trim(target_location_name))
  returning id into created_location_id;

  for item in
    select items.*
    from public.order_items items
    where items.order_id = source_order.id
    order by items.created_at, items.id
  loop
    units_per_purchase := case item.product_id
      when 'pack_duo_standard' then 2
      when 'pack_duo' then 2
      when 'pack_cinq_standard' then 5
      when 'pack_cinq' then 5
      when 'table6' then 6
      when 'pack_essentiel' then 2
      when 'pack_visibilite' then 3
      when 'pack_commerce' then 5
      when 'pack_restaurant' then 8
      when 'pack_resto' then case when item.unit_amount >= 18900 then 8 else 7 end
      when 'pack_salon' then 2
      when 'pack_equipe' then 7
      else 1
    end;

    composition_comptoir := 0;
    composition_plaque := 0;
    if item.product_id in ('pack_duo_standard', 'pack_duo', 'pack_cinq_standard', 'pack_cinq') then
      if coalesce(item.customization -> 'supportComposition' ->> 'comptoir', '') ~ '^[0-9]+$'
        and coalesce(item.customization -> 'supportComposition' ->> 'plaque', '') ~ '^[0-9]+$' then
        composition_comptoir := (item.customization -> 'supportComposition' ->> 'comptoir')::integer;
        composition_plaque := (item.customization -> 'supportComposition' ->> 'plaque')::integer;
      end if;

      if composition_comptoir + composition_plaque <> units_per_purchase then
        composition_comptoir := case when units_per_purchase = 2 then 1 else 2 end;
        composition_plaque := units_per_purchase - composition_comptoir;
      end if;
    end if;

    for purchase_index in 1..item.quantity loop
      for unit_index in 1..units_per_purchase loop
        physical_type := case
          when item.product_id in ('plaque_standard', 'plaque') then 'plaque'
          when item.product_id in ('comptoir_standard', 'comptoir') then 'comptoir'
          when item.product_id in ('carte_standard', 'carte', 'carte_assortie') then 'carte'
          when item.product_id in ('pack_duo_standard', 'pack_duo', 'pack_cinq_standard', 'pack_cinq')
            and unit_index <= composition_comptoir then 'comptoir'
          when item.product_id in ('pack_duo_standard', 'pack_duo', 'pack_cinq_standard', 'pack_cinq') then 'plaque'
          when item.product_id = 'pack_essentiel' and unit_index = 1 then 'plaque'
          when item.product_id = 'pack_essentiel' then 'carte'
          when item.product_id = 'pack_visibilite' and unit_index <= 2 then 'plaque'
          when item.product_id = 'pack_visibilite' then 'carte'
          when item.product_id = 'pack_commerce' and unit_index = 1 then 'comptoir'
          when item.product_id = 'pack_commerce' and unit_index = 2 then 'plaque'
          when item.product_id = 'pack_commerce' then 'carte'
          when item.product_id = 'pack_restaurant' and unit_index = 1 then 'comptoir'
          when item.product_id = 'pack_restaurant' and unit_index <= 7 then 'table6'
          when item.product_id = 'pack_restaurant' then 'sticker'
          when item.product_id = 'pack_resto' and unit_index = 1 then 'comptoir'
          when item.product_id = 'pack_resto' and item.unit_amount >= 18900 and unit_index = 8 then 'sticker'
          when item.product_id = 'pack_resto' then 'table6'
          when item.product_id = 'pack_salon' then 'comptoir'
          when item.product_id = 'pack_equipe' and unit_index <= 6 then 'carte'
          when item.product_id = 'pack_equipe' then 'sticker'
          else item.product_id
        end;
        product_label := private.storefront_product_name(item.product_id);
        if item.quantity * units_per_purchase > 1 then
          product_label := left(
            product_label || ' · ' || (((purchase_index - 1) * units_per_purchase) + unit_index)::text,
            100
          );
        end if;

        insert into public.tapote_links (
          organization_id, location_id, label, target_url
        ) values (
          created_organization_id, created_location_id,
          product_label, destination_url
        ) returning id into created_link_id;

        insert into public.tapote_products (
          organization_id, location_id, tapote_link_id, order_item_id,
          product_type, action_id, label, serial_number, status, activated_at
        ) values (
          created_organization_id, created_location_id, created_link_id, item.id,
          physical_type, item.action_id, product_label,
          'TAP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
          'active', now()
        );
        created_count := created_count + 1;
      end loop;
    end loop;
  end loop;

  if created_count = 0 then
    raise exception 'order_has_no_products' using errcode = '22023';
  end if;

  update public.order_provisioning provisioning
    set customer_organization_id = created_organization_id,
      customer_user_id = target_customer_user_id,
      status = 'active',
      last_error = null,
      activated_at = now()
  where provisioning.source_order_id = source_order.id;

  insert into public.management_activity (
    organization_id, kind, description, metadata
  ) values (
    management_order.organization_id,
    'system',
    'Espace Pilot activé pour ' || source_order.customer_business_name,
    jsonb_build_object(
      'source_order_id', source_order.id,
      'customer_organization_id', created_organization_id,
      'products_created', created_count
    )
  );

  return query select created_organization_id, created_location_id, created_count;
end;
$$;

revoke all on function private.activate_customer_workspace(uuid, uuid, text, text)
  from public, anon;
grant execute on function private.activate_customer_workspace(uuid, uuid, text, text)
  to authenticated;

commit;
