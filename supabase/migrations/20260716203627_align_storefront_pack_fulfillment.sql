-- Align the storefront offer IDs with management summaries and Pilot
-- provisioning. Legacy IDs remain mapped for already-paid orders.
create or replace function private.storefront_product_name(product_id text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case product_id
    when 'plaque' then 'La Plaque 12 × 12'
    when 'comptoir' then 'Le Comptoir A6'
    when 'table6' then 'Les Chevalets A6 ×6'
    when 'carte' then 'La Carte'
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

create or replace function public.activate_customer_workspace(
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

    for purchase_index in 1..item.quantity loop
      for unit_index in 1..units_per_purchase loop
        physical_type := case
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
revoke all on function public.activate_customer_workspace(uuid, uuid, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.activate_customer_workspace(uuid, uuid, text, text)
  to authenticated;
