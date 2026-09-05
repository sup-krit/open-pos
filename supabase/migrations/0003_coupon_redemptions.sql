-- ============================================================================
-- Open POS — coupon redemption history
-- Backs the per-customer coupon redemption limit
-- (promotions.coupon_redemption_limit_per_customer): one row per
-- successful redemption of a coupon-gated promotion on an order.
-- ============================================================================

-- ============================================================================
-- coupon_redemptions
-- ----------------------------------------------------------------------------
-- customer_id is nullable because guest/no-customer orders can still redeem
-- a coupon. A null-customer redemption can't be matched against a
-- per-customer limit later, so guest checkouts effectively bypass
-- coupon_redemption_limit_per_customer — only coupon_redemption_limit_total
-- still applies to them.
-- ============================================================================
create table coupon_redemptions (
  id            uuid primary key default gen_random_uuid(),
  promotion_id  uuid not null references promotions(id),
  customer_id   uuid references customers(id),
  order_id      uuid not null references orders(id),
  redeemed_at   timestamptz not null default now()
);

create index idx_coupon_redemptions_promotion_customer
  on coupon_redemptions (promotion_id, customer_id);

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- Mirrors the placeholder pattern used for every other table in
-- 0001_init.sql — see the notes there. TODO(roles) applies here too.
-- ============================================================================
alter table coupon_redemptions enable row level security;

create policy coupon_redemptions_select_authenticated
  on coupon_redemptions for select
  to authenticated
  using (true);

create policy coupon_redemptions_write_authenticated
  on coupon_redemptions for all
  to authenticated
  using (true)
  with check (true);

create policy coupon_redemptions_all_service_role
  on coupon_redemptions for all
  to service_role
  using (true)
  with check (true);
