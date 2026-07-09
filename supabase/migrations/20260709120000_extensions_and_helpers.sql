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
