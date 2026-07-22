begin;

-- A manually entered sale must never be treated as paid without an explicit
-- manager action. Storefront orders keep their explicit Stripe-derived status.
alter table public.management_orders
  alter column status set default 'payment_pending',
  alter column payment_status set default 'En attente';

alter table public.management_orders
  drop constraint if exists management_orders_status_check;
alter table public.management_orders
  add constraint management_orders_status_check check (
    status in (
      'payment_pending', 'paid', 'bat', 'supply', 'assembly', 'quality',
      'ready', 'shipped', 'cancelled'
    )
  );

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
  current_order public.management_orders;
  updated_order public.management_orders;
  flow constant text[] := array[
    'payment_pending', 'paid', 'bat', 'supply', 'assembly', 'quality',
    'ready', 'shipped'
  ];
begin
  if not (select private.is_management_member(target_organization_id)) then
    raise exception 'management_access_denied' using errcode = '42501';
  end if;

  select orders.* into current_order
  from public.management_orders orders
  where orders.organization_id = target_organization_id
    and orders.id = target_order_id
  for update;

  if current_order.id is null then
    raise exception 'management_order_not_found' using errcode = 'P0002';
  end if;
  if current_order.status is distinct from expected_status then
    raise exception 'management_order_conflict' using errcode = '40001';
  end if;

  current_index := array_position(flow, current_order.status);
  target_index := array_position(flow, target_status);
  if current_index is null or target_index is null or target_index <> current_index + 1 then
    raise exception 'invalid_order_transition' using errcode = '22023';
  end if;

  if target_status = 'shipped' and nullif(trim(target_tracking_number), '') is null then
    raise exception 'tracking_number_required' using errcode = '22023';
  end if;

  update public.management_orders orders
  set status = target_status,
      payment_status = case
        when target_status = 'paid' then 'Payé'
        else orders.payment_status
      end,
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
  returning orders.* into updated_order;

  return updated_order;
end;
$$;

revoke all on function public.advance_management_order(uuid, uuid, text, text, text)
  from public, anon;
grant execute on function public.advance_management_order(uuid, uuid, text, text, text)
  to authenticated;

create or replace function private.guard_management_assignment_payment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_status text;
begin
  if new.status <> 'assigned'
    or (tg_op = 'UPDATE' and old.status = 'assigned') then
    return new;
  end if;

  select orders.status into order_status
  from public.management_orders orders
  where orders.id = new.order_id
    and orders.organization_id = new.organization_id;

  if order_status is null then
    raise exception 'assigned_order_required' using errcode = '22023';
  end if;
  if order_status = 'payment_pending' then
    raise exception 'order_payment_required' using errcode = '22023';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_management_assignment_payment()
  from public, anon, authenticated;

drop trigger if exists management_product_unit_payment_guard
  on public.management_product_units;
create trigger management_product_unit_payment_guard
before insert or update of status on public.management_product_units
for each row execute function private.guard_management_assignment_payment();

comment on function public.advance_management_order(uuid, uuid, text, text, text) is
  'Transition atomique Gestion. Le passage payment_pending vers paid confirme explicitement le règlement.';

commit;
