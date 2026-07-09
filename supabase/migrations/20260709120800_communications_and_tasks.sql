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
