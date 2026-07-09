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
