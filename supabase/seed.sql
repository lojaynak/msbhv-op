-- ============================================================================
-- MSBHV Ops — Seed data
-- ============================================================================
-- Safe to run against any environment (local, staging, production). Contains
-- no user accounts or credentials — accounts are created via Supabase Auth
-- (admin invite), never seeded directly. See architecture doc §2.

insert into public.roles (name, permissions) values
  ('admin', '{}'::jsonb), -- is_admin() already grants everything; no flags needed
  ('ops_manager', '{
     "manage_orders": true,
     "manage_customers": true,
     "manage_products": true,
     "manage_inventory": true,
     "manage_shipments": true,
     "manage_payments": true,
     "manage_returns": true,
     "manage_communications": true,
     "manage_imports": true
   }'::jsonb),
  ('staff', '{
     "manage_orders": true,
     "manage_customers": true,
     "manage_shipments": true,
     "manage_returns": true,
     "manage_communications": true
   }'::jsonb),
  ('warehouse', '{
     "manage_inventory": true,
     "manage_shipments": true
   }'::jsonb)
on conflict (name) do nothing;
