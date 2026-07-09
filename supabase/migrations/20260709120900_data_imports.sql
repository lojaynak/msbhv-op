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
