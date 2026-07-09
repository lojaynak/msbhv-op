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
