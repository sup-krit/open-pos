-- ============================================================================
-- Open POS — initial schema
-- Single-brand retail POS / back-office system (portfolio project)
--
-- Conventions:
--   * Primary keys: uuid, default gen_random_uuid() (pgcrypto)
--   * Timestamps: timestamptz
--   * Money: bigint, integer minor units (e.g. satang) — never numeric/float
--   * updated_at: auto-maintained via shared set_updated_at() trigger
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto with schema public;

-- ----------------------------------------------------------------------------
-- Shared trigger function: auto-update updated_at on row modification
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- customers
-- ----------------------------------------------------------------------------
-- Purchase history (order count / lifetime spend) is derived via query/view
-- from `orders`, not duplicated on this table.
-- ============================================================================
create table customers (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  phone                  text,
  social_handle          text,
  tag                    text,                       -- e.g. 'VIP', nullable
  pdpa_consent           boolean not null default false,
  address_subdistrict    text,
  address_district       text,
  address_province       text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create trigger trg_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

create index idx_customers_tag on customers (tag);
create index idx_customers_phone on customers (phone);

-- ============================================================================
-- products  (business term: "Inventory Item")
-- ============================================================================
create table products (
  id                 uuid primary key default gen_random_uuid(),
  sku                text not null unique,
  name               text not null,
  group_name         text,
  variant_attribute  text,
  lot                text,
  cost_minor         bigint not null default 0,
  price_minor        bigint not null default 0,
  margin_pct         numeric(5,2),
  profit_minor       bigint,
  status             text not null default 'in_stock'
                       check (status in ('in_stock', 'low_stock', 'out_of_stock')),
  vendor             text,
  custom_fields      jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

create index idx_products_status on products (status);
create index idx_products_group_name on products (group_name);
create index idx_products_vendor on products (vendor);

-- ============================================================================
-- promotions
-- ============================================================================
create table promotions (
  id                                  uuid primary key default gen_random_uuid(),
  name                                text not null,
  description                         text,
  status                              text not null default 'active'
                                        check (status in ('active', 'inactive')),
  condition_type                      text
                                        check (condition_type in ('qty', 'amount', 'variant')),
  discount_type                       text
                                        check (discount_type in ('percent', 'fixed', 'bogo')),
  min_value                           numeric,
  start_date                          date,
  end_date                            date,
  priority                            int not null default 0,
  auto_apply                          boolean not null default false,
  manual_selectable                   boolean not null default false,
  stackable                           boolean not null default false,
  bogo_buy_qty                        int,
  bogo_get_qty                        int,
  bogo_get_discount_pct               numeric(5,2),
  coupon_code                         text unique,
  coupon_redemption_limit_total       int,
  coupon_redemption_limit_per_customer int,
  coupon_redemption_count             int not null default 0,
  coupon_valid_from                   timestamptz,
  coupon_valid_until                  timestamptz,
  is_reward_coupon                    boolean not null default false,
  reward_threshold_amount_minor       bigint,
  reward_parent_promotion_id          uuid references promotions(id),
  created_at                          timestamptz not null default now(),
  updated_at                          timestamptz not null default now()
);

create trigger trg_promotions_updated_at
  before update on promotions
  for each row execute function set_updated_at();

create index idx_promotions_status on promotions (status);
-- coupon_code already has a unique index via the UNIQUE constraint above
create index idx_promotions_reward_parent_promotion_id on promotions (reward_parent_promotion_id);
create index idx_promotions_dates on promotions (start_date, end_date);

-- ============================================================================
-- orders
-- ============================================================================
create table orders (
  id                          uuid primary key default gen_random_uuid(),
  created_at                  timestamptz not null default now(),
  channel                     text,
  customer_id                 uuid references customers(id),
  subtotal_minor               bigint not null default 0,
  shipping_cost_minor          bigint not null default 0,
  discount_amount_minor        bigint not null default 0,
  net_total_minor              bigint not null default 0,
  promotion_id                 uuid references promotions(id),
  shipping_type                text,
  shipping_status              text not null default 'new_order'
                                 check (shipping_status in ('new_order', 'shipped')),
  payment_method                text
                                 check (payment_method in ('qr', 'card')),
  payment_status                text not null default 'unpaid'
                                 check (payment_status in ('unpaid', 'paid', 'deposit')),
  tracking_number               text,
  checkout_token                text unique,
  checkout_token_expires_at     timestamptz,
  updated_at                    timestamptz not null default now()
);

comment on column orders.shipping_status is
  'Auto-derives from tracking_number being set — enforced at the application '
  'layer, not a DB trigger (kept simple at this stage; a future migration '
  'could add a trigger).';

create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

create index idx_orders_customer_id on orders (customer_id);
create index idx_orders_promotion_id on orders (promotion_id);
create index idx_orders_shipping_status on orders (shipping_status);
create index idx_orders_payment_status on orders (payment_status);
create index idx_orders_channel on orders (channel);
create index idx_orders_created_at on orders (created_at);

-- ============================================================================
-- order_line_items
-- ============================================================================
create table order_line_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  product_id         uuid references products(id),
  qty                int not null check (qty > 0),
  unit_price_minor   bigint not null
);

create index idx_order_line_items_order_id on order_line_items (order_id);
create index idx_order_line_items_product_id on order_line_items (product_id);

-- ============================================================================
-- accounting_transactions
-- ============================================================================
create table accounting_transactions (
  id                        uuid primary key default gen_random_uuid(),
  date                      date not null,
  description               text,
  debit_minor               bigint not null default 0,
  credit_minor              bigint not null default 0,
  balance_minor             bigint not null default 0,
  category                  text,
  reconciliation_status     text not null default 'needs_review'
                              check (reconciliation_status in ('needs_review', 'matched')),
  created_at                timestamptz not null default now()
);

create index idx_accounting_transactions_date on accounting_transactions (date);
create index idx_accounting_transactions_category on accounting_transactions (category);
create index idx_accounting_transactions_reconciliation_status
  on accounting_transactions (reconciliation_status);

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- This is a single-tenant internal back-office (not multi-tenant SaaS), so
-- the security model is intentionally simple at this stage. Real Supabase
-- Auth roles (staff / owner / admin) are not wired up yet — that's a later
-- phase. These are straightforward placeholder policies:
--
--   * `authenticated` users can SELECT everything (staff back-office reads).
--   * `service_role` (the backend's direct Postgres connection — this
--     already bypasses RLS, but we spell it out explicitly for clarity) can
--     do everything on every table.
--   * `orders` / `customers` / `order_line_items` / `products`: any
--     authenticated user (staff) can read/write for now.
--   * `promotions` / `accounting_transactions`: currently also open to any
--     authenticated user for read/write, but flagged below — writes to
--     these two tables must eventually be gated to owner/admin roles only,
--     per requirements.
--
-- TODO(roles): once staff/owner/admin roles exist (e.g. a custom JWT claim
-- or a `staff` table keyed off auth.users), revisit ALL policies below and
-- replace the blanket `authenticated` checks with proper role checks.
-- ============================================================================

-- ---------- customers ----------
alter table customers enable row level security;

create policy customers_select_authenticated
  on customers for select
  to authenticated
  using (true);

create policy customers_write_authenticated
  on customers for all
  to authenticated
  using (true)
  with check (true);

create policy customers_all_service_role
  on customers for all
  to service_role
  using (true)
  with check (true);

-- ---------- products ----------
alter table products enable row level security;

create policy products_select_authenticated
  on products for select
  to authenticated
  using (true);

create policy products_write_authenticated
  on products for all
  to authenticated
  using (true)
  with check (true);

create policy products_all_service_role
  on products for all
  to service_role
  using (true)
  with check (true);

-- ---------- promotions ----------
-- TODO(roles): restrict write access to owner/admin once role claims exist.
alter table promotions enable row level security;

create policy promotions_select_authenticated
  on promotions for select
  to authenticated
  using (true);

create policy promotions_write_authenticated
  on promotions for all
  to authenticated
  using (true)
  with check (true);

create policy promotions_all_service_role
  on promotions for all
  to service_role
  using (true)
  with check (true);

-- ---------- orders ----------
alter table orders enable row level security;

create policy orders_select_authenticated
  on orders for select
  to authenticated
  using (true);

create policy orders_write_authenticated
  on orders for all
  to authenticated
  using (true)
  with check (true);

create policy orders_all_service_role
  on orders for all
  to service_role
  using (true)
  with check (true);

-- ---------- order_line_items ----------
alter table order_line_items enable row level security;

create policy order_line_items_select_authenticated
  on order_line_items for select
  to authenticated
  using (true);

create policy order_line_items_write_authenticated
  on order_line_items for all
  to authenticated
  using (true)
  with check (true);

create policy order_line_items_all_service_role
  on order_line_items for all
  to service_role
  using (true)
  with check (true);

-- ---------- accounting_transactions ----------
-- TODO(roles): restrict write access to owner/admin once role claims exist.
alter table accounting_transactions enable row level security;

create policy accounting_transactions_select_authenticated
  on accounting_transactions for select
  to authenticated
  using (true);

create policy accounting_transactions_write_authenticated
  on accounting_transactions for all
  to authenticated
  using (true)
  with check (true);

create policy accounting_transactions_all_service_role
  on accounting_transactions for all
  to service_role
  using (true)
  with check (true);
