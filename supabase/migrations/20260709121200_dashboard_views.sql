-- ============================================================================
-- MSBHV Ops — 0013: Dashboard support view
-- ============================================================================
-- Powers the "Inventory Alerts" dashboard card. PostgREST (Supabase's query
-- layer) can't filter one column against another (quantity_on_hand <=
-- low_stock_threshold) with a simple .lte() call, so that comparison lives
-- in a view instead.
--
-- `security_invoker = true` is important: without it, a view runs with the
-- privileges of whoever *created* the view, bypassing RLS for everyone who
-- queries it. With it, Postgres re-checks RLS as the actual calling user —
-- so this view is exactly as safe as querying `inventory` directly.

create view public.v_low_stock_inventory
with (security_invoker = true) as
select
  i.id,
  i.variant_id,
  i.quantity_on_hand,
  i.quantity_reserved,
  i.low_stock_threshold,
  i.location,
  pv.sku,
  p.name as product_name
from public.inventory i
join public.product_variants pv on pv.id = i.variant_id
join public.products p on p.id = pv.product_id
where i.quantity_on_hand <= i.low_stock_threshold;

comment on view public.v_low_stock_inventory is
  'Inventory rows at or below their low-stock threshold. security_invoker=true means RLS is enforced as the querying user, not the view owner.';
