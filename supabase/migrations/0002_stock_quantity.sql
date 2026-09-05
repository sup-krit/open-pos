-- ============================================================================
-- Open POS — stock-quantity tracking
-- Adds real stock-quantity tracking to products so `status` can be derived
-- from quantity vs. a threshold instead of a hardcoded default.
-- ============================================================================

alter table products
  add column stock_quantity      integer not null default 0,
  add column low_stock_threshold integer not null default 5;
