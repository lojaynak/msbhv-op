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
