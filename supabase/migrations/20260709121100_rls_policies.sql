-- ============================================================================
-- MSBHV Ops — 0012: Row Level Security
-- ============================================================================
-- See architecture doc §3.14. RLS is enabled on every table. Permissions are
-- read from `roles.permissions` (jsonb), so granting a new permission later
-- is a data change, not a migration. This is also the boundary that makes
-- the future AI Assistant safe (§6.4): it queries through the same
-- authenticated session, so it is bound by these exact same policies.

-- ----------------------------------------------------------------------------
-- Helper functions (security definer to avoid RLS recursion when a policy on
-- `users`/`roles` needs to read `users`/`roles` to evaluate itself)
-- ----------------------------------------------------------------------------

create or replace function public.current_role_name()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.name
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() = 'admin';
$$;

create or replace function public.has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_admin() or (
      select (r.permissions ->> perm)::boolean
      from public.users u
      join public.roles r on r.id = u.role_id
      where u.id = auth.uid()
    ),
    false
  );
$$;

comment on function public.has_permission(text) is
  'True if the signed-in user is admin, or their role has the named permission set true in roles.permissions.';

-- Prevents a non-admin from granting themselves a role or reactivating
-- their own disabled account via a direct row update.
create or replace function public.prevent_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role_id is distinct from old.role_id or new.is_active is distinct from old.is_active then
      raise exception 'Only admins can change role or active status';
    end if;
  end if;
  return new;
end;
$$;

create trigger prevent_privilege_escalation
  before update on public.users
  for each row execute function public.prevent_privilege_escalation();

-- ----------------------------------------------------------------------------
-- Enable RLS everywhere
-- ----------------------------------------------------------------------------

alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.customer_notes enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_notes enable row level security;
alter table public.shipments enable row level security;
alter table public.payments enable row level security;
alter table public.returns enable row level security;
alter table public.exchanges enable row level security;
alter table public.communications enable row level security;
alter table public.tasks enable row level security;
alter table public.data_imports enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

-- ----------------------------------------------------------------------------
-- roles — readable by any signed-in user (needed to show role names in UI),
-- writable by admins only
-- ----------------------------------------------------------------------------

create policy "roles_select_authenticated" on public.roles
  for select to authenticated using (true);

create policy "roles_write_admin" on public.roles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- users — staff directory is visible to any signed-in user; admins manage
-- accounts; a user may update their own profile (role/active status are
-- protected separately by the trigger above)
-- ----------------------------------------------------------------------------

create policy "users_select_authenticated" on public.users
  for select to authenticated using (true);

create policy "users_insert_admin" on public.users
  for insert to authenticated with check (public.is_admin());

create policy "users_update_self_or_admin" on public.users
  for update to authenticated
  using (public.is_admin() or auth.uid() = id)
  with check (public.is_admin() or auth.uid() = id);

create policy "users_delete_admin" on public.users
  for delete to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
-- Generic operational tables — helper macro pattern applied per table:
--   SELECT: any signed-in user
--   INSERT/UPDATE: admin or role has the matching manage_* permission
--   DELETE: admin only
-- ----------------------------------------------------------------------------

-- customers
create policy "customers_select" on public.customers for select to authenticated using (true);
create policy "customers_insert" on public.customers for insert to authenticated with check (public.has_permission('manage_customers'));
create policy "customers_update" on public.customers for update to authenticated using (public.has_permission('manage_customers')) with check (public.has_permission('manage_customers'));
create policy "customers_delete" on public.customers for delete to authenticated using (public.is_admin());

-- customer_notes
create policy "customer_notes_select" on public.customer_notes for select to authenticated using (true);
create policy "customer_notes_insert" on public.customer_notes for insert to authenticated with check (public.has_permission('manage_customers') and author_id = auth.uid());
create policy "customer_notes_update" on public.customer_notes for update to authenticated using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy "customer_notes_delete" on public.customer_notes for delete to authenticated using (public.is_admin());

-- products / product_variants
create policy "products_select" on public.products for select to authenticated using (true);
create policy "products_insert" on public.products for insert to authenticated with check (public.has_permission('manage_products'));
create policy "products_update" on public.products for update to authenticated using (public.has_permission('manage_products')) with check (public.has_permission('manage_products'));
create policy "products_delete" on public.products for delete to authenticated using (public.is_admin());

create policy "product_variants_select" on public.product_variants for select to authenticated using (true);
create policy "product_variants_insert" on public.product_variants for insert to authenticated with check (public.has_permission('manage_products'));
create policy "product_variants_update" on public.product_variants for update to authenticated using (public.has_permission('manage_products')) with check (public.has_permission('manage_products'));
create policy "product_variants_delete" on public.product_variants for delete to authenticated using (public.is_admin());

-- inventory (warehouse role manages this without needing manage_products)
create policy "inventory_select" on public.inventory for select to authenticated using (true);
create policy "inventory_insert" on public.inventory for insert to authenticated with check (public.has_permission('manage_inventory'));
create policy "inventory_update" on public.inventory for update to authenticated using (public.has_permission('manage_inventory')) with check (public.has_permission('manage_inventory'));
create policy "inventory_delete" on public.inventory for delete to authenticated using (public.is_admin());

-- orders / order_items
create policy "orders_select" on public.orders for select to authenticated using (true);
create policy "orders_insert" on public.orders for insert to authenticated with check (public.has_permission('manage_orders'));
create policy "orders_update" on public.orders for update to authenticated using (public.has_permission('manage_orders')) with check (public.has_permission('manage_orders'));
create policy "orders_delete" on public.orders for delete to authenticated using (public.is_admin());

create policy "order_items_select" on public.order_items for select to authenticated using (true);
create policy "order_items_insert" on public.order_items for insert to authenticated with check (public.has_permission('manage_orders'));
create policy "order_items_update" on public.order_items for update to authenticated using (public.has_permission('manage_orders')) with check (public.has_permission('manage_orders'));
create policy "order_items_delete" on public.order_items for delete to authenticated using (public.is_admin());

-- order_status_history (system/trigger-written; humans read-only, admin can correct)
create policy "order_status_history_select" on public.order_status_history for select to authenticated using (true);
create policy "order_status_history_write_admin" on public.order_status_history for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- order_notes
create policy "order_notes_select" on public.order_notes for select to authenticated using (true);
create policy "order_notes_insert" on public.order_notes for insert to authenticated with check (public.has_permission('manage_orders') and author_id = auth.uid());
create policy "order_notes_update" on public.order_notes for update to authenticated using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy "order_notes_delete" on public.order_notes for delete to authenticated using (public.is_admin());

-- shipments (warehouse role manages via manage_shipments, distinct from manage_orders)
create policy "shipments_select" on public.shipments for select to authenticated using (true);
create policy "shipments_insert" on public.shipments for insert to authenticated with check (public.has_permission('manage_shipments'));
create policy "shipments_update" on public.shipments for update to authenticated using (public.has_permission('manage_shipments')) with check (public.has_permission('manage_shipments'));
create policy "shipments_delete" on public.shipments for delete to authenticated using (public.is_admin());

-- payments (deliberately its own permission — finance-sensitive, per §3.14 example)
create policy "payments_select" on public.payments for select to authenticated using (true);
create policy "payments_insert" on public.payments for insert to authenticated with check (public.has_permission('manage_payments'));
create policy "payments_update" on public.payments for update to authenticated using (public.has_permission('manage_payments')) with check (public.has_permission('manage_payments'));
create policy "payments_delete" on public.payments for delete to authenticated using (public.is_admin());

-- returns / exchanges
create policy "returns_select" on public.returns for select to authenticated using (true);
create policy "returns_insert" on public.returns for insert to authenticated with check (public.has_permission('manage_returns'));
create policy "returns_update" on public.returns for update to authenticated using (public.has_permission('manage_returns')) with check (public.has_permission('manage_returns'));
create policy "returns_delete" on public.returns for delete to authenticated using (public.is_admin());

create policy "exchanges_select" on public.exchanges for select to authenticated using (true);
create policy "exchanges_insert" on public.exchanges for insert to authenticated with check (public.has_permission('manage_returns'));
create policy "exchanges_update" on public.exchanges for update to authenticated using (public.has_permission('manage_returns')) with check (public.has_permission('manage_returns'));
create policy "exchanges_delete" on public.exchanges for delete to authenticated using (public.is_admin());

-- communications
create policy "communications_select" on public.communications for select to authenticated using (true);
create policy "communications_insert" on public.communications for insert to authenticated with check (public.has_permission('manage_communications'));
create policy "communications_update" on public.communications for update to authenticated using (public.has_permission('manage_communications')) with check (public.has_permission('manage_communications'));
create policy "communications_delete" on public.communications for delete to authenticated using (public.is_admin());

-- tasks (any signed-in user can create/manage their own tasks; admins manage all)
create policy "tasks_select" on public.tasks for select to authenticated using (true);
create policy "tasks_insert" on public.tasks for insert to authenticated with check (created_by = auth.uid());
create policy "tasks_update" on public.tasks for update to authenticated
  using (public.is_admin() or created_by = auth.uid() or assigned_to = auth.uid())
  with check (public.is_admin() or created_by = auth.uid() or assigned_to = auth.uid());
create policy "tasks_delete" on public.tasks for delete to authenticated using (public.is_admin() or created_by = auth.uid());

-- data_imports (admins and anyone with manage_imports permission)
create policy "data_imports_select" on public.data_imports for select to authenticated using (true);
create policy "data_imports_write" on public.data_imports for all to authenticated
  using (public.has_permission('manage_imports')) with check (public.has_permission('manage_imports'));

-- ----------------------------------------------------------------------------
-- ai_conversations / ai_messages — strictly private to the owning user, even
-- from other staff. Admins do not get a blanket bypass here on purpose: chat
-- history is personal, unlike operational data.
-- ----------------------------------------------------------------------------

create policy "ai_conversations_owner_only" on public.ai_conversations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "ai_messages_owner_only" on public.ai_messages
  for all to authenticated using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
