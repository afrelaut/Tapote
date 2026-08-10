begin;

-- Catalogue de lancement validé le 10 août 2026. Les lignes historiques
-- restent présentes pour les commandes déjà payées, mais aucune ne reste
-- achetable. Cette table temporaire évite de répéter la grille dans la migration;
-- la source applicative partagée reste autoritaire pour le calcul des commandes.
update public.management_storefront_products
set online = false,
    updated_at = now()
where external_product_id is not null;

create temporary table tapote_launch_catalog (
  product_id text primary key,
  product_name text not null,
  price_cents integer not null check (price_cents > 0),
  physical_type text not null check (physical_type in ('comptoir', 'plaque', 'carte', 'pack'))
) on commit drop;

insert into tapote_launch_catalog (product_id, product_name, price_cents, physical_type)
values
  ('chevalet_pret', 'Chevalet prêt à poser', 4900, 'comptoir'),
  ('chevalet_personnalise', 'Chevalet personnalisé', 5900, 'comptoir'),
  ('plaque_prete', 'Plaque prête à poser', 2900, 'plaque'),
  ('plaque_personnalisee', 'Plaque personnalisée', 3900, 'plaque'),
  ('carte_prete', 'Carte prête à l''emploi', 1900, 'carte'),
  ('carte_personnalisee', 'Carte personnalisée', 2900, 'carte'),
  ('pack_essentiel_pret', 'Essentiel · Prêt à poser', 7900, 'pack'),
  ('pack_essentiel', 'Essentiel', 9900, 'pack'),
  ('pack_comptoir_pret', 'Comptoir · Prêt à poser', 11900, 'pack'),
  ('pack_comptoir', 'Comptoir', 14900, 'pack'),
  ('pack_equipe_pret', 'Équipe · Prêt à poser', 17900, 'pack'),
  ('pack_equipe', 'Équipe', 21900, 'pack');

with ranked as (
  select products.id,
    products.organization_id,
    products.external_product_id,
    row_number() over (
      partition by products.organization_id, products.external_product_id
      order by products.updated_at desc, products.created_at desc, products.id
    ) as position
  from public.management_storefront_products products
  join tapote_launch_catalog official on official.product_id = products.external_product_id
)
update public.management_storefront_products products
set name = official.product_name,
    price_cents = official.price_cents,
    inventory_item_id = case when official.physical_type = 'pack' then null else products.inventory_item_id end,
    online = ranked.position = 1,
    updated_at = now()
from tapote_launch_catalog official, ranked
where products.id = ranked.id
  and products.external_product_id = official.product_id;

with management_organizations as (
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
select organizations.organization_id,
  inventory.id,
  official.product_id,
  official.product_name,
  official.price_cents,
  true
from management_organizations organizations
cross join tapote_launch_catalog official
left join lateral (
  select items.id
  from public.management_inventory_items items
  where items.organization_id = organizations.organization_id
    and items.archived_at is null
    and (
      (official.physical_type = 'comptoir' and items.sku = 'SUP-A6-CLR')
      or (official.physical_type = 'plaque' and items.sku = 'PLAQUE-PVC-12')
      or (official.physical_type = 'carte' and items.sku = 'CARD-PVC-W')
    )
  order by items.created_at
  limit 1
) inventory on true
where not exists (
  select 1
  from public.management_storefront_products existing
  where existing.organization_id = organizations.organization_id
    and existing.external_product_id = official.product_id
);

-- Ajoute le nouvel identifiant sans retirer les libellés historiques utilisés
-- lors de l'activation tardive d'anciennes commandes.
create or replace function private.storefront_product_name(product_id text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case product_id
    when 'chevalet_pret' then 'Chevalet prêt à poser'
    when 'chevalet_personnalise' then 'Chevalet personnalisé'
    when 'plaque_prete' then 'Plaque prête à poser'
    when 'plaque_personnalisee' then 'Plaque personnalisée'
    when 'carte_prete' then 'Carte prête à l''emploi'
    when 'carte_personnalisee' then 'Carte personnalisée'
    when 'pack_essentiel_pret' then 'Essentiel · Prêt à poser'
    when 'pack_comptoir' then 'Comptoir'
    when 'pack_comptoir_pret' then 'Comptoir · Prêt à poser'
    when 'pack_essentiel' then 'Essentiel'
    when 'pack_equipe_pret' then 'Équipe · Prêt à poser'
    when 'pack_equipe' then 'Équipe'
    when 'carte' then 'Carte personnalisée seule (historique)'
    when 'plaque_standard' then 'La Plaque 12 × 12 · Prête à l’emploi'
    when 'plaque' then 'La Plaque 12 × 12'
    when 'comptoir_standard' then 'Le Chevalet A6 · Prêt à l’emploi'
    when 'comptoir' then 'Le Chevalet A6'
    when 'carte_standard' then 'La Carte · Prête à l’emploi'
    when 'pack_duo_standard' then '2 supports · Prêts à l’emploi'
    when 'pack_duo' then '2 supports'
    when 'pack_cinq_standard' then '5 supports · Prêts à l’emploi'
    when 'pack_cinq' then '5 supports'
    when 'carte_assortie' then 'La Carte assortie'
    when 'table6' then 'Les Chevalets A6 ×6'
    when 'sticker' then 'La Vitrine'
    when 'mini' then 'Le Mini Comptoir'
    when 'pack_visibilite' then 'Pack Visibilité'
    when 'pack_commerce' then 'Pack Commerce'
    when 'pack_restaurant' then 'Pack Restaurant (alias)'
    when 'pack_resto' then 'Pack Restaurant'
    when 'pack_salon' then 'Pack Salon'
    else left(product_id, 160)
  end;
$$;
revoke all on function private.storefront_product_name(text)
  from public, anon, authenticated, service_role;

-- Les nouvelles commandes enregistrent {comptoir, plaque, carte}. L'absence de cette
-- composition déclenche strictement les anciennes branches afin de ne jamais
-- réinterpréter une commande historique portant le même productId.
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
  composition_carte integer;
  uses_launch_composition boolean;
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
    composition_comptoir := 0;
    composition_plaque := 0;
    composition_carte := 0;
    uses_launch_composition := false;

    if coalesce(item.customization -> 'supportComposition' ->> 'comptoir', '') ~ '^[0-9]+$'
      and coalesce(item.customization -> 'supportComposition' ->> 'plaque', '') ~ '^[0-9]+$'
      and coalesce(item.customization -> 'supportComposition' ->> 'carte', '') ~ '^[0-9]+$' then
      composition_comptoir := (item.customization -> 'supportComposition' ->> 'comptoir')::integer;
      composition_plaque := (item.customization -> 'supportComposition' ->> 'plaque')::integer;
      composition_carte := (item.customization -> 'supportComposition' ->> 'carte')::integer;
      units_per_purchase := composition_comptoir + composition_plaque + composition_carte;
      uses_launch_composition := item.product_id in (
        'chevalet_pret', 'chevalet_personnalise',
        'plaque_prete', 'plaque_personnalisee',
        'carte_prete', 'carte_personnalisee',
        'pack_essentiel_pret', 'pack_essentiel',
        'pack_comptoir_pret', 'pack_comptoir',
        'pack_equipe_pret', 'pack_equipe'
      )
        and units_per_purchase > 0;
    end if;

    if not uses_launch_composition then
      units_per_purchase := case item.product_id
        when 'pack_duo_standard' then 2
        when 'pack_duo' then 2
        when 'pack_cinq_standard' then 5
        when 'pack_cinq' then 5
        when 'table6' then 6
        when 'chevalet_pret' then 1
        when 'chevalet_personnalise' then 1
        when 'plaque_prete' then 1
        when 'plaque_personnalisee' then 1
        when 'carte_prete' then 1
        when 'carte_personnalisee' then 1
        when 'pack_essentiel_pret' then 3
        when 'pack_comptoir_pret' then 4
        when 'pack_comptoir' then 4
        when 'pack_equipe_pret' then 7
        when 'pack_essentiel' then 2
        when 'pack_visibilite' then 3
        when 'pack_commerce' then 5
        when 'pack_restaurant' then 8
        when 'pack_resto' then case when item.unit_amount >= 18900 then 8 else 7 end
        when 'pack_salon' then 2
        when 'pack_equipe' then 7
        else 1
      end;

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
    end if;

    for purchase_index in 1..item.quantity loop
      for unit_index in 1..units_per_purchase loop
        physical_type := case
          when uses_launch_composition and unit_index <= composition_comptoir then 'comptoir'
          when uses_launch_composition and unit_index <= composition_comptoir + composition_plaque then 'plaque'
          when uses_launch_composition then 'carte'
          when item.product_id in ('chevalet_pret', 'chevalet_personnalise') then 'comptoir'
          when item.product_id in ('plaque_prete', 'plaque_personnalisee') then 'plaque'
          when item.product_id in ('carte_prete', 'carte_personnalisee') then 'carte'
          when item.product_id = 'pack_essentiel_pret' and unit_index = 1 then 'comptoir'
          when item.product_id = 'pack_essentiel_pret' and unit_index = 2 then 'plaque'
          when item.product_id = 'pack_essentiel_pret' then 'carte'
          when item.product_id in ('pack_comptoir_pret', 'pack_comptoir') and unit_index <= 2 then 'comptoir'
          when item.product_id in ('pack_comptoir_pret', 'pack_comptoir') and unit_index = 3 then 'plaque'
          when item.product_id in ('pack_comptoir_pret', 'pack_comptoir') then 'carte'
          when item.product_id = 'pack_equipe_pret' and unit_index <= 2 then 'comptoir'
          when item.product_id = 'pack_equipe_pret' and unit_index <= 4 then 'plaque'
          when item.product_id = 'pack_equipe_pret' then 'carte'
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
