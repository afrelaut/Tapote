begin;

alter function public.activate_customer_workspace(uuid, uuid, text, text)
  set schema private;
alter function public.create_management_encoded_product(uuid, uuid, uuid, text, text, text, text, text, text)
  set schema private;
alter function public.advance_management_encoded_product(uuid, uuid, text, text, boolean, boolean, boolean)
  set schema private;

revoke all on function private.activate_customer_workspace(uuid, uuid, text, text)
  from public, anon;
revoke all on function private.create_management_encoded_product(uuid, uuid, uuid, text, text, text, text, text, text)
  from public, anon;
revoke all on function private.advance_management_encoded_product(uuid, uuid, text, text, boolean, boolean, boolean)
  from public, anon;
grant execute on function private.activate_customer_workspace(uuid, uuid, text, text)
  to authenticated;
grant execute on function private.create_management_encoded_product(uuid, uuid, uuid, text, text, text, text, text, text)
  to authenticated;
grant execute on function private.advance_management_encoded_product(uuid, uuid, text, text, boolean, boolean, boolean)
  to authenticated;

create function public.activate_customer_workspace(
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
language sql
security invoker
set search_path = ''
as $$
  select * from private.activate_customer_workspace(
    target_management_order_id,
    target_customer_user_id,
    target_location_name,
    target_url
  );
$$;

create function public.create_management_encoded_product(
  target_organization_id uuid,
  target_order_id uuid,
  target_client_id uuid,
  target_support_type text,
  target_chip_type text,
  target_chip_batch text,
  target_label text,
  target_url text,
  target_notes text default null
)
returns public.management_product_units
language sql
security invoker
set search_path = ''
as $$
  select private.create_management_encoded_product(
    target_organization_id,
    target_order_id,
    target_client_id,
    target_support_type,
    target_chip_type,
    target_chip_batch,
    target_label,
    target_url,
    target_notes
  );
$$;

create function public.advance_management_encoded_product(
  target_organization_id uuid,
  target_product_unit_id uuid,
  expected_status text,
  target_status text,
  target_iphone_test boolean default false,
  target_android_test boolean default false,
  target_qr_test boolean default false
)
returns public.management_product_units
language sql
security invoker
set search_path = ''
as $$
  select private.advance_management_encoded_product(
    target_organization_id,
    target_product_unit_id,
    expected_status,
    target_status,
    target_iphone_test,
    target_android_test,
    target_qr_test
  );
$$;

revoke all on function public.activate_customer_workspace(uuid, uuid, text, text)
  from public, anon;
revoke all on function public.create_management_encoded_product(uuid, uuid, uuid, text, text, text, text, text, text)
  from public, anon;
revoke all on function public.advance_management_encoded_product(uuid, uuid, text, text, boolean, boolean, boolean)
  from public, anon;
grant execute on function public.activate_customer_workspace(uuid, uuid, text, text)
  to authenticated;
grant execute on function public.create_management_encoded_product(uuid, uuid, uuid, text, text, text, text, text, text)
  to authenticated;
grant execute on function public.advance_management_encoded_product(uuid, uuid, text, text, boolean, boolean, boolean)
  to authenticated;

comment on function public.activate_customer_workspace(uuid, uuid, text, text) is
  'Invoker wrapper around a private, membership-checked provisioning operation.';
comment on function public.create_management_encoded_product(uuid, uuid, uuid, text, text, text, text, text, text) is
  'Invoker wrapper around a private, membership-checked product creation operation.';
comment on function public.advance_management_encoded_product(uuid, uuid, text, text, boolean, boolean, boolean) is
  'Invoker wrapper around a private, membership-checked encoding state transition.';

commit;
