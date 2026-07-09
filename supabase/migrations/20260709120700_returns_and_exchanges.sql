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
