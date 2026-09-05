# TODO

Living task list. History/journal lives in `docs/progress-log.md` — check it for context on any item below.

## Blocking

- [x] Merge PR #1, delete its branch — already merged into `master` (`9b93f59`); confirmed via `gh pr list --state all`, no open PRs remain. Deleted `orders-back-office` branch (local+remote).

## Features

- [x] **Checkout link flow** — token issued on order creation (7-day expiry), `app/checkout/[token]/page.tsx` wired live, copyable link on `/orders/new` success screen. Payment QR still placeholder (no PromptPay merchant config exists).
- [ ] **Promotion engine** (`backend/app/services/promotions.py`):
  - [x] BOGO buy/get discount math — cycle = buy_qty+get_qty, discount applied to cart's cheapest eligible units
  - [x] Per-customer coupon redemption limit — `coupon_redemptions` history table (`0003_coupon_redemptions.sql`), enforced in `coupon_ok()`; guest orders (no customer) only subject to the total limit
  - [ ] Reward-coupon auto-issuance on threshold
- [x] **Stock decrement on sale** — `stock_quantity`/`low_stock_threshold` columns added (`0002_stock_quantity.sql`), order creation decrements stock and re-derives `status` via `services/products.py::compute_status`
- [x] **Auth** — `get_current_user`/`require_role` verify real Supabase JWTs (HS256 + JWKS/ES256), login screen at `/login`, route guards on all back-office pages + POS, Promotions/Accounting nav+routes gated to `owner_admin`. Staff accounts provisioned manually via Supabase Studio (set `app_metadata.role`).

## Polish

- [x] Promotions form — real list/create/edit/status-toggle wired to backend, BOGO + coupon fields conditional, live preview computed from form state
- [x] Customers page — real list/search/VIP-filter, row-click detail panel with real address + recent orders (client-filtered from orders list)
- [ ] Back-office pages still static/unwired: Inventory inline-edit, Accounting upload
- [ ] Dashboard real charts (currently static numbers) — use `dataviz` skill
- [x] `customers` list endpoint: `total_spent_minor` comes back as `Decimal` instead of `int` (harmless Pydantic warning) — cast it in `routers/customers.py`
