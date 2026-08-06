-- Retour d'une étape dans le flux de production.
--
-- Le flux n'allait que vers l'avant : `target_index <> current_index + 1`.
-- Un opérateur qui cliquait « Contrôle terminé » par erreur — le bouton est
-- présent à deux endroits, sans confirmation — faisait avancer la commande
-- définitivement. Aucun chemin ne permettait de revenir, et la seule issue
-- restante était de continuer vers l'expédition, contrôle qualité sauté.
--
-- Le choix retenu privilégie la réparabilité plutôt que la confirmation :
-- l'avancement reste en un clic, geste courant qui doit rester rapide, et
-- l'erreur devient rattrapable d'un pas.
--
-- Deux garde-fous : on ne revient jamais d'une commande expédiée, car le colis
-- est physiquement parti, et jamais avant la première étape.

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
  if current_index is null or target_index is null then
    raise exception 'invalid_order_transition' using errcode = '22023';
  end if;

  -- Un pas en avant, ou un pas en arrière pour corriger une fausse manœuvre.
  if target_index <> current_index + 1 and target_index <> current_index - 1 then
    raise exception 'invalid_order_transition' using errcode = '22023';
  end if;

  -- Une commande expédiée ne revient pas : le colis a quitté l'atelier.
  if target_index < current_index and current_order.status = 'shipped' then
    raise exception 'shipped_order_is_final' using errcode = '22023';
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
