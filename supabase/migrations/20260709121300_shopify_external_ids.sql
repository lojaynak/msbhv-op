-- ============================================================================
-- MSBHV Ops — 0014: Shopify external IDs + integration health tracking
-- ============================================================================
-- Adds the remaining external-ID columns needed for Shopify upsert-by-ID
-- (products/variants/orders already had theirs reserved in Phase 1).
-- Stores GraphQL Admin API GIDs (e.g. "gid://shopify/Order/450789469") —
-- globally unique across resource types, which is why they're used as-is
-- rather than extracting the trailing numeric ID.

alter table public.customers
  add column shopify_customer_id text unique;

alter table public.shipments
  add column shopify_fulfillment_id text unique;

alter table public.payments
  add column shopify_transaction_id text unique;

comment on column public.customers.shopify_customer_id is 'Shopify GraphQL GID — upsert key for Shopify sync, prevents duplicate customer records.';
comment on column public.shipments.shopify_fulfillment_id is 'Shopify GraphQL GID for the fulfillment — upsert key, distinct from shipblu_shipment_id.';
comment on column public.payments.shopify_transaction_id is 'Shopify GraphQL GID for the transaction/refund — upsert key.';

-- Powers the "Shopify Connected / ShipBlu Connected / Last Successful Sync /
-- Last Error" health indicators from the integration architecture. One row
-- per integration, updated by webhook/sync code after every attempt.
create table public.integration_status (
  id               uuid primary key default gen_random_uuid(),
  integration      text not null unique check (integration in ('shopify', 'shipblu')),
  connected        boolean not null default false,
  last_success_at  timestamptz,
  last_error       text,
  last_error_at    timestamptz,
  updated_at       timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.integration_status
  for each row execute function public.set_updated_at();

insert into public.integration_status (integration, connected) values
  ('shopify', false),
  ('shipblu', false);

alter table public.integration_status enable row level security;

create policy "integration_status_select" on public.integration_status
  for select to authenticated using (true);

-- Written only by server-side sync code using the admin (secret-key)
-- client, which bypasses RLS entirely — this policy just prevents normal
-- signed-in users from editing health status directly through the API.
create policy "integration_status_write_admin" on public.integration_status
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
