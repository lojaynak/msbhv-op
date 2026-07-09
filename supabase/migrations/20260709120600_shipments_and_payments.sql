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
