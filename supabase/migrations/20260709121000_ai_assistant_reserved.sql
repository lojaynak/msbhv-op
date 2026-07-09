-- ============================================================================
-- MSBHV Ops — 0011: AI Assistant (reserved — storage only, no AI logic)
-- ============================================================================
-- See architecture doc §3.15 and §6.4. These tables only persist conversation
-- history. They grant the AI no capability by existing — the actual read
-- access boundary is built later as views/RPC functions, not here.

create table public.ai_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_conversations_user_id_idx on public.ai_conversations (user_id);

create trigger set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create table public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'tool')),
  content         text not null,
  tool_calls      jsonb,
  created_at      timestamptz not null default now()
);

comment on column public.ai_messages.tool_calls is
  'Records which read-only view/RPC the assistant used to answer, for auditability. See §6.4.';

create index ai_messages_conversation_id_idx on public.ai_messages (conversation_id);
