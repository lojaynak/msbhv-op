-- ==============================================================
-- MSBHV Ops — Full database setup (all migrations + seed data)
-- Paste this entire file into Supabase Dashboard > SQL Editor > New
-- query, then click Run. Safe to run once on a fresh project.
-- ==============================================================

-- ---- 20260709120000_extensions_and_helpers.sql ----
-- ============================================================================
-- MSBHV Ops — 0001: Extensions & shared helpers
-- ============================================================================
-- Runs first. Sets up uuid generation and a reusable "updated_at" trigger that
-- every subsequent migration attaches to its tables. Nothing here is
-- application data — it's plumbing every other migration depends on.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- Generic trigger: keeps `updated_at` accurate without relying on app code to
-- remember to set it on every update. Attached per-table below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Sets updated_at = now() on any UPDATE. Attached as a BEFORE UPDATE trigger on tables that have an updated_at column.';

-- ---- 20260709120100_roles_and_users.sql ----
-- ============================================================================
-- MSBHV Ops — 0002: Roles & Users
-- ============================================================================
-- See architecture doc §3.1. `roles.permissions` is a flexible jsonb map
-- (e.g. {"manage_orders": true, "manage_payments": false}) so adding a new
-- permission later is a data change, not a schema migration.

create table public.roles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  permissions jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.roles is 'Named roles (admin, ops_manager, staff, warehouse, ...) with a flexible permissions map.';

-- Mirrors auth.users 1:1. Supabase's auth schema is intentionally minimal and
-- locked down; this companion table holds app-specific fields and is what
-- every RLS policy and SQL join in this project references.
create table public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  email      text not null unique,
  avatar_url text,
  role_id    uuid references public.roles (id),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'App-facing user profile, 1:1 with auth.users. No public sign-up — rows are created by an admin invite flow.';

create index users_role_id_idx on public.users (role_id);

create trigger set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Auto-create a public.users row whenever a new auth.users row appears, so
-- the app never has to remember to do this manually after an invite/sign-up.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---- 20260709120200_customers.sql ----
-- ============================================================================
-- MSBHV Ops — 0003: Customers
-- ============================================================================
-- See architecture doc §3.2. `phone` is first-class because WhatsApp
-- automation (later phase) is built around it as the join key.

create table public.customers (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  phone        text not null,
  email        text,
  address_line text,
  city         text,
  governorate  text,
  tags         text[] not null default '{}',
  source       text not null default 'manual', -- 'manual' | 'csv_import' | 'shopify'
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.customers is 'Customer records. `source` and future external-id columns support the import-adapter pattern (§3.12).';

create index customers_phone_idx on public.customers (phone);

create trigger set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- Structured note history, mirroring order_notes — see §3.2 for why this
-- replaces a single free-text `notes` column.
create table public.customer_notes (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  author_id   uuid references public.users (id),
  note        text not null,
  created_at  timestamptz not null default now()
);

create index customer_notes_customer_id_idx on public.customer_notes (customer_id);

-- ---- 20260709120300_products_and_inventory.sql ----
-- ============================================================================
-- MSBHV Ops — 0004: Products, Variants & Inventory
-- ============================================================================
-- See architecture doc §3.3 (why variants are a separate table) and §3.4
-- (why quantity_reserved is split from quantity_on_hand).

create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text,
  category            text,
  status              text not null default 'draft', -- 'draft' | 'active' | 'archived'
  shopify_product_id  text unique, -- reserved for Phase 2+ Shopify sync
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references public.products (id) on delete cascade,
  sku                 text not null unique,
  size                text,
  color               text,
  price               numeric(10, 2) not null check (price >= 0),
  shopify_variant_id  text unique, -- reserved for Phase 2+
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index product_variants_product_id_idx on public.product_variants (product_id);

create trigger set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

create table public.inventory (
  id                  uuid primary key default gen_random_uuid(),
  variant_id          uuid not null unique references public.product_variants (id) on delete cascade,
  quantity_on_hand    integer not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved   integer not null default 0 check (quantity_reserved >= 0),
  low_stock_threshold integer not null default 5,
  location            text, -- reserved for future multi-warehouse support
  updated_at          timestamptz not null default now()
);

comment on column public.inventory.quantity_reserved is
  'Stock held for confirmed-but-unshipped orders — kept separate from quantity_on_hand to prevent overselling. See §3.4.';

create trigger set_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

-- ---- 20260709120400_orders.sql ----
-- ============================================================================
-- MSBHV Ops — 0005: Orders & Order Items
-- ============================================================================
-- See architecture doc §3.5. `unit_price` is snapshotted on order_items so a
-- later price change never rewrites what a customer actually paid.

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique,
  customer_id       uuid not null references public.customers (id),
  status            text not null default 'pending_confirmation'
                       check (status in (
                         'pending_confirmation', 'confirmed', 'ready_to_ship',
                         'in_transit', 'delivered', 'returned', 'cancelled'
                       )),
  payment_method    text not null default 'cod', -- 'cod' | 'card' | 'wallet'
  subtotal          numeric(10, 2) not null default 0,
  shipping_fee      numeric(10, 2) not null default 0,
  discount          numeric(10, 2) not null default 0,
  total             numeric(10, 2) not null default 0,
  source            text not null default 'manual', -- 'manual' | 'shopify'
  shopify_order_id  text unique, -- reserved for Phase 2+
  assigned_to       uuid references public.users (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index orders_customer_id_idx on public.orders (customer_id);
create index orders_status_idx on public.orders (status);
create index orders_assigned_to_idx on public.orders (assigned_to);
create index orders_created_at_idx on public.orders (created_at desc);

create trigger set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  variant_id  uuid not null references public.product_variants (id),
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(10, 2) not null check (unit_price >= 0),
  created_at  timestamptz not null default now()
);

comment on column public.order_items.unit_price is
  'Snapshot of price at time of order — never re-derived from product_variants.price. See §3.5.';

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_variant_id_idx on public.order_items (variant_id);

-- ---- 20260709120500_order_support.sql ----
-- ============================================================================
-- MSBHV Ops — 0006: Order Status History & Order Notes
-- ============================================================================
-- See architecture doc §3.6 — kept as two separate tables (structured
-- transitions vs. freeform human notes) so future analytics can query status
-- transitions cleanly without parsing text.

create table public.order_status_history (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  from_status text,
  to_status   text not null,
  changed_by  uuid references public.users (id), -- null = system/automation (future)
  changed_at  timestamptz not null default now()
);

create index order_status_history_order_id_idx on public.order_status_history (order_id);

create table public.order_notes (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  author_id  uuid not null references public.users (id),
  note       text not null,
  created_at timestamptz not null default now()
);

create index order_notes_order_id_idx on public.order_notes (order_id);

-- Logs every status change automatically, so the app never has to remember
-- to write to order_status_history separately from updating orders.status.
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  elsif (tg_op = 'INSERT') then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger log_order_status_change
  after insert or update on public.orders
  for each row execute function public.log_order_status_change();

-- ---- 20260709120600_shipments_and_payments.sql ----
-- ============================================================================
-- MSBHV Ops — 0007: Shipments & Payments
-- ============================================================================
-- See architecture doc §3.7 (why shipments is its own table, supporting
-- multiple attempts per order) and §3.8 (why payments is separate from
-- orders.total — this is what powers the "Cash Waiting" dashboard card).

create table public.shipments (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders (id) on delete cascade,
  carrier               text, -- e.g. 'ShipBlu' — reserved for Phase 2+
  tracking_number       text unique,
  status                text not null default 'pending'
                           check (status in ('pending', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned')),
  shipblu_shipment_id   text unique, -- reserved for Phase 2+ ShipBlu API
  shipped_at            timestamptz,
  delivered_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index shipments_order_id_idx on public.shipments (order_id);
create index shipments_status_idx on public.shipments (status);

create trigger set_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

create table public.payments (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  amount        numeric(10, 2) not null check (amount >= 0),
  method        text not null, -- 'cod' | 'card' | 'wallet'
  status        text not null default 'pending'
                   check (status in ('pending', 'collected', 'failed', 'refunded')),
  collected_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index payments_order_id_idx on public.payments (order_id);
create index payments_status_idx on public.payments (status);

-- ---- 20260709120700_returns_and_exchanges.sql ----
-- ============================================================================
-- MSBHV Ops — 0008: Returns & Exchanges
-- ============================================================================
-- See architecture doc §3.9 — kept as two tables because their data shapes
-- genuinely differ (an exchange always has a new_variant_id, a return never does).

create table public.returns (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders (id),
  reason        text,
  status        text not null default 'requested'
                   check (status in ('requested', 'approved', 'received', 'refunded', 'rejected')),
  requested_at  timestamptz not null default now(),
  resolved_at   timestamptz
);

create index returns_order_id_idx on public.returns (order_id);
create index returns_status_idx on public.returns (status);

create table public.exchanges (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders (id),
  original_variant_id   uuid not null references public.product_variants (id),
  new_variant_id        uuid not null references public.product_variants (id),
  status                text not null default 'requested'
                           check (status in ('requested', 'approved', 'shipped', 'completed', 'rejected')),
  requested_at          timestamptz not null default now(),
  resolved_at           timestamptz
);

create index exchanges_order_id_idx on public.exchanges (order_id);
create index exchanges_status_idx on public.exchanges (status);

-- ---- 20260709120800_communications_and_tasks.sql ----
-- ============================================================================
-- MSBHV Ops — 0009: Communications & Tasks
-- ============================================================================
-- See architecture doc §3.10 (Communications — reserved shape, no sending
-- logic yet) and §3.11 (Tasks — internal follow-ups).

create table public.communications (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers (id) on delete cascade,
  order_id     uuid references public.orders (id),
  channel      text not null check (channel in ('whatsapp', 'instagram', 'email', 'sms')),
  direction    text not null check (direction in ('inbound', 'outbound')),
  message      text not null,
  status       text check (status in ('sent', 'delivered', 'read', 'failed')),
  sent_by      uuid references public.users (id), -- null = automation (future)
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index communications_customer_id_idx on public.communications (customer_id);
create index communications_order_id_idx on public.communications (order_id);
create index communications_occurred_at_idx on public.communications (occurred_at desc);

create table public.tasks (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  description           text,
  status                text not null default 'open'
                           check (status in ('open', 'in_progress', 'done', 'cancelled')),
  priority              text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  assigned_to           uuid references public.users (id),
  created_by            uuid not null references public.users (id),
  related_order_id      uuid references public.orders (id),
  related_customer_id   uuid references public.customers (id),
  due_at                timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index tasks_status_idx on public.tasks (status);
create index tasks_related_order_id_idx on public.tasks (related_order_id);
create index tasks_related_customer_id_idx on public.tasks (related_customer_id);

create trigger set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---- 20260709120900_data_imports.sql ----
-- ============================================================================
-- MSBHV Ops — 0010: Data Imports
-- ============================================================================
-- See architecture doc §3.12. Logs every CSV/API import run for auditability.
-- Not linked to a single entity table by foreign key — it's a run log, not
-- operational data.

create table public.data_imports (
  id            uuid primary key default gen_random_uuid(),
  source        text not null, -- 'csv' | 'shopify' | 'shipblu'
  entity        text not null, -- 'customers' | 'products' | 'orders' | ...
  status        text not null default 'pending'
                   check (status in ('pending', 'processing', 'completed', 'failed')),
  row_count     integer,
  error_log     jsonb,
  imported_by   uuid references public.users (id),
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index data_imports_status_idx on public.data_imports (status);
create index data_imports_created_at_idx on public.data_imports (created_at desc);

-- ---- 20260709121000_ai_assistant_reserved.sql ----
-- ============================================================================
-- MSBHV Ops — 0011: AI Assistant (reserved — storage only, no AI logic)
-- ============================================================================
-- See architecture doc §3.15 and §6.4. These tables only persist conversation
-- history. They grant the AI no capability by existing — the actual read
-- access boundary is built later as views/RPC functions, not here.

create table public.ai_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_conversations_user_id_idx on public.ai_conversations (user_id);

create trigger set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create table public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'tool')),
  content         text not null,
  tool_calls      jsonb,
  created_at      timestamptz not null default now()
);

comment on column public.ai_messages.tool_calls is
  'Records which read-only view/RPC the assistant used to answer, for auditability. See §6.4.';

create index ai_messages_conversation_id_idx on public.ai_messages (conversation_id);

-- ---- 20260709121100_rls_policies.sql ----
-- ============================================================================
-- MSBHV Ops — 0012: Row Level Security
-- ============================================================================
-- See architecture doc §3.14. RLS is enabled on every table. Permissions are
-- read from `roles.permissions` (jsonb), so granting a new permission later
-- is a data change, not a migration. This is also the boundary that makes
-- the future AI Assistant safe (§6.4): it queries through the same
-- authenticated session, so it is bound by these exact same policies.

-- ----------------------------------------------------------------------------
-- Helper functions (security definer to avoid RLS recursion when a policy on
-- `users`/`roles` needs to read `users`/`roles` to evaluate itself)
-- ----------------------------------------------------------------------------

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.name
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() = 'admin';
$$;

create or replace function public.has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_admin() or (
      select (r.permissions ->> perm)::boolean
      from public.users u
      join public.roles r on r.id = u.role_id
      where u.id = auth.uid()
    ),
    false
  );
$$;

comment on function public.has_permission(text) is
  'True if the signed-in user is admin, or their role has the named permission set true in roles.permissions.';

-- Prevents a non-admin from granting themselves a role or reactivating
-- their own disabled account via a direct row update.
create or replace function public.prevent_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role_id is distinct from old.role_id or new.is_active is distinct from old.is_active then
      raise exception 'Only admins can change role or active status';
    end if;
  end if;
  return new;
end;
$$;

create trigger prevent_privilege_escalation
  before update on public.users
  for each row execute function public.prevent_privilege_escalation();

-- ----------------------------------------------------------------------------
-- Enable RLS everywhere
-- ----------------------------------------------------------------------------

alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.customer_notes enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_notes enable row level security;
alter table public.shipments enable row level security;
alter table public.payments enable row level security;
alter table public.returns enable row level security;
alter table public.exchanges enable row level security;
alter table public.communications enable row level security;
alter table public.tasks enable row level security;
alter table public.data_imports enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

-- ----------------------------------------------------------------------------
-- roles — readable by any signed-in user (needed to show role names in UI),
-- writable by admins only
-- ----------------------------------------------------------------------------

create policy "roles_select_authenticated" on public.roles
  for select to authenticated using (true);

create policy "roles_write_admin" on public.roles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- users — staff directory is visible to any signed-in user; admins manage
-- accounts; a user may update their own profile (role/active status are
-- protected separately by the trigger above)
-- ----------------------------------------------------------------------------

create policy "users_select_authenticated" on public.users
  for select to authenticated using (true);

create policy "users_insert_admin" on public.users
  for insert to authenticated with check (public.is_admin());

create policy "users_update_self_or_admin" on public.users
  for update to authenticated
  using (public.is_admin() or auth.uid() = id)
  with check (public.is_admin() or auth.uid() = id);

create policy "users_delete_admin" on public.users
  for delete to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Generic operational tables — helper macro pattern applied per table:
--   SELECT: any signed-in user
--   INSERT/UPDATE: admin or role has the matching manage_* permission
--   DELETE: admin only
-- ----------------------------------------------------------------------------

-- customers
create policy "customers_select" on public.customers for select to authenticated using (true);
create policy "customers_insert" on public.customers for insert to authenticated with check (public.has_permission('manage_customers'));
create policy "customers_update" on public.customers for update to authenticated using (public.has_permission('manage_customers')) with check (public.has_permission('manage_customers'));
create policy "customers_delete" on public.customers for delete to authenticated using (public.is_admin());

-- customer_notes
create policy "customer_notes_select" on public.customer_notes for select to authenticated using (true);
create policy "customer_notes_insert" on public.customer_notes for insert to authenticated with check (public.has_permission('manage_customers') and author_id = auth.uid());
create policy "customer_notes_update" on public.customer_notes for update to authenticated using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy "customer_notes_delete" on public.customer_notes for delete to authenticated using (public.is_admin());

-- products / product_variants
create policy "products_select" on public.products for select to authenticated using (true);
create policy "products_insert" on public.products for insert to authenticated with check (public.has_permission('manage_products'));
create policy "products_update" on public.products for update to authenticated using (public.has_permission('manage_products')) with check (public.has_permission('manage_products'));
create policy "products_delete" on public.products for delete to authenticated using (public.is_admin());

create policy "product_variants_select" on public.product_variants for select to authenticated using (true);
create policy "product_variants_insert" on public.product_variants for insert to authenticated with check (public.has_permission('manage_products'));
create policy "product_variants_update" on public.product_variants for update to authenticated using (public.has_permission('manage_products')) with check (public.has_permission('manage_products'));
create policy "product_variants_delete" on public.product_variants for delete to authenticated using (public.is_admin());

-- inventory (warehouse role manages this without needing manage_products)
create policy "inventory_select" on public.inventory for select to authenticated using (true);
create policy "inventory_insert" on public.inventory for insert to authenticated with check (public.has_permission('manage_inventory'));
create policy "inventory_update" on public.inventory for update to authenticated using (public.has_permission('manage_inventory')) with check (public.has_permission('manage_inventory'));
create policy "inventory_delete" on public.inventory for delete to authenticated using (public.is_admin());

-- orders / order_items
create policy "orders_select" on public.orders for select to authenticated using (true);
create policy "orders_insert" on public.orders for insert to authenticated with check (public.has_permission('manage_orders'));
create policy "orders_update" on public.orders for update to authenticated using (public.has_permission('manage_orders')) with check (public.has_permission('manage_orders'));
create policy "orders_delete" on public.orders for delete to authenticated using (public.is_admin());

create policy "order_items_select" on public.order_items for select to authenticated using (true);
create policy "order_items_insert" on public.order_items for insert to authenticated with check (public.has_permission('manage_orders'));
create policy "order_items_update" on public.order_items for update to authenticated using (public.has_permission('manage_orders')) with check (public.has_permission('manage_orders'));
create policy "order_items_delete" on public.order_items for delete to authenticated using (public.is_admin());

-- order_status_history (system/trigger-written; humans read-only, admin can correct)
create policy "order_status_history_select" on public.order_status_history for select to authenticated using (true);
create policy "order_status_history_write_admin" on public.order_status_history for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- order_notes
create policy "order_notes_select" on public.order_notes for select to authenticated using (true);
create policy "order_notes_insert" on public.order_notes for insert to authenticated with check (public.has_permission('manage_orders') and author_id = auth.uid());
create policy "order_notes_update" on public.order_notes for update to authenticated using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy "order_notes_delete" on public.order_notes for delete to authenticated using (public.is_admin());

-- shipments (warehouse role manages via manage_shipments, distinct from manage_orders)
create policy "shipments_select" on public.shipments for select to authenticated using (true);
create policy "shipments_insert" on public.shipments for insert to authenticated with check (public.has_permission('manage_shipments'));
create policy "shipments_update" on public.shipments for update to authenticated using (public.has_permission('manage_shipments')) with check (public.has_permission('manage_shipments'));
create policy "shipments_delete" on public.shipments for delete to authenticated using (public.is_admin());

-- payments (deliberately its own permission — finance-sensitive, per §3.14 example)
create policy "payments_select" on public.payments for select to authenticated using (true);
create policy "payments_insert" on public.payments for insert to authenticated with check (public.has_permission('manage_payments'));
create policy "payments_update" on public.payments for update to authenticated using (public.has_permission('manage_payments')) with check (public.has_permission('manage_payments'));
create policy "payments_delete" on public.payments for delete to authenticated using (public.is_admin());

-- returns / exchanges
create policy "returns_select" on public.returns for select to authenticated using (true);
create policy "returns_insert" on public.returns for insert to authenticated with check (public.has_permission('manage_returns'));
create policy "returns_update" on public.returns for update to authenticated using (public.has_permission('manage_returns')) with check (public.has_permission('manage_returns'));
create policy "returns_delete" on public.returns for delete to authenticated using (public.is_admin());

create policy "exchanges_select" on public.exchanges for select to authenticated using (true);
create policy "exchanges_insert" on public.exchanges for insert to authenticated with check (public.has_permission('manage_returns'));
create policy "exchanges_update" on public.exchanges for update to authenticated using (public.has_permission('manage_returns')) with check (public.has_permission('manage_returns'));
create policy "exchanges_delete" on public.exchanges for delete to authenticated using (public.is_admin());

-- communications
create policy "communications_select" on public.communications for select to authenticated using (true);
create policy "communications_insert" on public.communications for insert to authenticated with check (public.has_permission('manage_communications'));
create policy "communications_update" on public.communications for update to authenticated using (public.has_permission('manage_communications')) with check (public.has_permission('manage_communications'));
create policy "communications_delete" on public.communications for delete to authenticated using (public.is_admin());

-- tasks (any signed-in user can create/manage their own tasks; admins manage all)
create policy "tasks_select" on public.tasks for select to authenticated using (true);
create policy "tasks_insert" on public.tasks for insert to authenticated with check (created_by = auth.uid());
create policy "tasks_update" on public.tasks for update to authenticated
  using (public.is_admin() or created_by = auth.uid() or assigned_to = auth.uid())
  with check (public.is_admin() or created_by = auth.uid() or assigned_to = auth.uid());
create policy "tasks_delete" on public.tasks for delete to authenticated using (public.is_admin() or created_by = auth.uid());

-- data_imports (admins and anyone with manage_imports permission)
create policy "data_imports_select" on public.data_imports for select to authenticated using (true);
create policy "data_imports_write" on public.data_imports for all to authenticated
  using (public.has_permission('manage_imports')) with check (public.has_permission('manage_imports'));

-- ----------------------------------------------------------------------------
-- ai_conversations / ai_messages — strictly private to the owning user, even
-- from other staff. Admins do not get a blanket bypass here on purpose: chat
-- history is personal, unlike operational data.
-- ----------------------------------------------------------------------------

create policy "ai_conversations_owner_only" on public.ai_conversations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "ai_messages_owner_only" on public.ai_messages
  for all to authenticated using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- ---- 20260709121200_dashboard_views.sql ----
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

-- ---- seed.sql (default roles) ----
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
