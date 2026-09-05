# TODO

Living task list. History/journal lives in `docs/progress-log.md` — check it for context on any item below.

## Blocking

- [x] Merge PR #1, delete its branch — already merged into `master` (`9b93f59`); confirmed via `gh pr list --state all`, no open PRs remain. Deleted `orders-back-office` branch (local+remote).

## Features

- [ ] **Checkout link flow** — `app/checkout/[token]/page.tsx` wired to `/checkout/{token}`; generate token + payment QR on order creation from back-office "Add order" flow (acknowledged gap on `/orders/new` success screen)
- [ ] **Promotion engine** (`backend/app/services/promotions.py`):
  - [ ] BOGO buy/get discount math (currently returns ฿0)
  - [ ] Per-customer coupon redemption limit
  - [ ] Reward-coupon auto-issuance on threshold
- [ ] **Stock decrement on sale** — not implemented; needs stock-quantity column (schema currently only has `status` enum) for `status` to auto-derive instead of always defaulting to `in_stock`
- [x] **Auth** — `get_current_user`/`require_role` verify real Supabase JWTs (HS256 + JWKS/ES256), login screen at `/login`, route guards on all back-office pages + POS, Promotions/Accounting nav+routes gated to `owner_admin`. Staff accounts provisioned manually via Supabase Studio (set `app_metadata.role`).

## Polish

- [ ] Back-office pages still static/unwired: Inventory inline-edit, Customers, Promotions form, Accounting upload
- [ ] Dashboard real charts (currently static numbers) — use `dataviz` skill
- [x] `customers` list endpoint: `total_spent_minor` comes back as `Decimal` instead of `int` (harmless Pydantic warning) — cast it in `routers/customers.py`
