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
