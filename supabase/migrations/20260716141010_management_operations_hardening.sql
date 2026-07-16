-- Keep manager actions safe when several private accounts are working at once.
-- Both functions use compare-and-set/row-level updates so the browser never has
-- to calculate a new shared value from a potentially stale snapshot.

create or replace function public.receive_management_stock(
  target_organization_id uuid,
  target_inventory_item_id uuid,
  target_quantity integer
)
returns public.management_inventory_items
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_item public.management_inventory_items;
begin
  if target_quantity is null or target_quantity <= 0 or target_quantity > 100000 then
    raise exception 'invalid_stock_quantity' using errcode = '22023';
  end if;

  if not (select private.is_management_member(target_organization_id)) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;

  update public.management_inventory_items inventory
  set stock_quantity = inventory.stock_quantity + target_quantity,
      incoming_quantity = greatest(0, inventory.incoming_quantity - target_quantity)
  where inventory.organization_id = target_organization_id
    and inventory.id = target_inventory_item_id
    and inventory.archived_at is null
  returning inventory.* into updated_item;

  if updated_item.id is null then
    raise exception 'inventory_item_not_found' using errcode = 'P0002';
  end if;

  return updated_item;
end;
$$;

revoke all on function public.receive_management_stock(uuid, uuid, integer)
  from public, anon;
grant execute on function public.receive_management_stock(uuid, uuid, integer)
  to authenticated;

create or replace function public.advance_management_order(
  target_organization_id uuid,
  target_order_id uuid,
  expected_status text,
  target_status text,
  target_tracking_number text default null
)
returns public.management_orders
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_index integer;
  target_index integer;
  updated_order public.management_orders;
  flow constant text[] := array['paid', 'bat', 'supply', 'assembly', 'quality', 'ready', 'shipped'];
begin
  if not (select private.is_management_member(target_organization_id)) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;

  current_index := array_position(flow, expected_status);
  target_index := array_position(flow, target_status);
  if current_index is null or target_index is null or target_index <> current_index + 1 then
    raise exception 'invalid_order_transition' using errcode = '22023';
  end if;

  if target_status = 'shipped' and nullif(trim(target_tracking_number), '') is null then
    raise exception 'tracking_number_required' using errcode = '22023';
  end if;

  update public.management_orders orders
  set status = target_status,
      tracking_number = case
        when target_status = 'shipped' then trim(target_tracking_number)
        else orders.tracking_number
      end,
      shipped_at = case
        when target_status = 'shipped' then coalesce(orders.shipped_at, now())
        else orders.shipped_at
      end
  where orders.organization_id = target_organization_id
    and orders.id = target_order_id
    and orders.status = expected_status
  returning orders.* into updated_order;

  if updated_order.id is null then
    if exists (
      select 1 from public.management_orders orders
      where orders.organization_id = target_organization_id
        and orders.id = target_order_id
    ) then
      raise exception 'management_order_conflict' using errcode = '40001';
    end if;
    raise exception 'management_order_not_found' using errcode = 'P0002';
  end if;

  return updated_order;
end;
$$;

revoke all on function public.advance_management_order(uuid, uuid, text, text, text)
  from public, anon;
grant execute on function public.advance_management_order(uuid, uuid, text, text, text)
  to authenticated;

comment on function public.receive_management_stock(uuid, uuid, integer) is
  'Réception atomique d un stock Gestion, protégée par le rôle interne et RLS.';
comment on function public.advance_management_order(uuid, uuid, text, text, text) is
  'Transition atomique et séquentielle d une commande Gestion.';
