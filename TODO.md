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
- [ ] **Auth** — `get_current_user`/`require_role` are stubs; no login screen on frontend. Needed before owner/admin-gated routes (promotions activation, accounting) mean anything

## Polish

- [ ] Back-office pages still static/unwired: Inventory inline-edit, Customers, Promotions form, Accounting upload
- [ ] Dashboard real charts (currently static numbers) — use `dataviz` skill
- [ ] `customers` list endpoint: `total_spent_minor` comes back as `Decimal` instead of `int` (harmless Pydantic warning) — cast it in `routers/customers.py`
