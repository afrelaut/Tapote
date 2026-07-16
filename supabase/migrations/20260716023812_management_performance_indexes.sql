-- Indexes couvrant les clés étrangères du domaine Gestion.
-- Remote migration version: 20260716023812.
create index management_activity_actor_idx on public.management_activity(actor_user_id) where actor_user_id is not null;
create index management_audit_actor_idx on public.management_audit_logs(actor_user_id) where actor_user_id is not null;
create index management_order_events_actor_idx on public.management_order_events(actor_user_id) where actor_user_id is not null;
create index management_orders_created_by_idx on public.management_orders(created_by) where created_by is not null;
create index management_orders_source_idx on public.management_orders(source_order_id) where source_order_id is not null;
create index management_production_assignee_idx on public.management_production_jobs(assigned_to) where assigned_to is not null;
create index management_profiles_user_idx on public.management_profiles(user_id);
create index management_purchase_items_inventory_idx on public.management_purchase_order_items(organization_id, inventory_item_id);
create index management_purchase_items_order_idx on public.management_purchase_order_items(organization_id, purchase_order_id);
create index management_purchase_items_org_idx on public.management_purchase_order_items(organization_id);
create index management_purchase_created_by_idx on public.management_purchase_orders(created_by) where created_by is not null;
create index management_purchase_supplier_idx on public.management_purchase_orders(organization_id, supplier_id);
create index management_storefront_inventory_idx on public.management_storefront_products(organization_id, inventory_item_id) where inventory_item_id is not null;
