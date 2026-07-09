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
