# Progress log

## 2026-09-04 — 2026-09-05

### Done
- `docs/requirements.md` — full SRS (single-brand scope, all decisions locked: BOGO/coupon/reward-coupon, dashboard analytics breakdowns, extensibility for other business types).
- `docs/diagrams/` — 8 diagrams (architecture, ER, POS flow, order lifecycle, inventory flow, promotion evaluation, checkout-token sequence, bank reconciliation), HTML+SVG.
- `docs/ux/wireframes/` — 8-artboard Claude Design canvas, hi-fi "Warm Editorial" palette (paper #FAF7F2 / ink #241F1A / accent #C2542E, Newsreader+Work Sans). Published: https://claude.ai/code/artifact/84474527-2748-4141-acc3-b5e7bf41a5da
- Full scaffold: `frontend/` (Next.js 15/Tailwind), `backend/` (FastAPI), `supabase/` (Postgres schema+seed+RLS), root tooling.
- **POS/Sell screen wired to real backend** — live product search, real cart, live promotion evaluation, real order creation, e-receipt. Merged: PR #1.
- **Orders back-office wired** (`/orders`, `/orders/[id]`, `/orders/new`) — filterable list, tracking/payment edit with auto-ship, order creation. Open, not yet merged: **PR #1 on the current repo** — https://github.com/sup-krit/open-pos/pull/1
- **Bug class found + fixed (audited across the whole backend)**: several DB columns are nullable in the Supabase migration but were declared non-null in the matching SQLAlchemy model / Pydantic response schema, crashing list endpoints with `ResponseValidationError` on any row with a null value. Fixed so far: `orders.payment_method` (PR #1), `promotions.condition_type/discount_type/min_value/start_date`, `customers.phone`, `products.group_name/lot/vendor`, `accounting_transactions.description/category` (all in PR #2). **If a new endpoint starts 500ing with `ResponseValidationError`, check this pattern first** — compare the failing field's nullability in `supabase/migrations/0001_init.sql` against its SQLAlchemy model and Pydantic schema.

### Repo / remote
- GitHub remote changed twice today, settled on: **https://github.com/sup-krit/open-pos** (`origin`). History: `poomrs444/open-pos` → `phumkritSP/open-pos` → `sup-krit/open-pos`, same commits carried forward each time (no rewrite). The two earlier repos still exist on GitHub with the same history up to that point, just no longer tracked here — safe to ignore or delete later.
- Why the moves: git commit authorship was split between the local git identity (`phumkrit.sup <Phumkrit.sup@gmail.com>`, used by every direct commit) and whichever GitHub account was logged into the web UI when a PR got merged there (that merge commit — `f05ced3` — is authored `Phumkrit <...@users.noreply.github.com>` under `poomrs444`, since that's who clicked "Merge" on GitHub.com). Consolidated everything under the `sup-krit` GitHub account + `phumkrit.sup` git identity to stop the split. **That one merge commit's author was NOT rewritten** — rewriting published history felt riskier than it was worth for a cosmetic authorship mismatch on one old commit; it's still sitting in `master`'s history under the old attribution if it ever needs cleaning up.
- `gh` CLI (winget, v2.100.0) has two accounts logged in — `sup-krit` (active) and `poomrs444` (inactive, from earlier today). Use `sup-krit` for anything on this repo; switch active account with `gh auth switch` if `gh` ever seems to be acting as the wrong one.
- **PR #1 (on `sup-krit/open-pos`) is open, not merged** — https://github.com/sup-krit/open-pos/pull/1 — merge it (or `gh pr merge 1`) before starting new work on top of `master` tomorrow, or continue on the `orders-back-office` branch.

### Local dev environment — currently ALL STOPPED
Backend (uvicorn, was port 8000), frontend (`npm run dev`, was port 3000), and Supabase (`supabase stop` — was ports 54321-54324) were all shut down at the end of this session. A separate, unrelated Postgres instance on port 5432 was left alone (not part of this project — do not touch/assume it's Supabase's).

### Known local dev quirks hit today (informational)
- Adding a new route file (e.g. `orders/new/page.tsx`) while `next dev` is already running can corrupt its route manifest — a chunk (e.g. the route group's `layout.js`) starts 404/503ing and the page silently stops hydrating (no console error, just frozen SSR output, no network calls ever fire). Fix: restart `npm run dev`. If a page loads its shell but interactive/fetched content never appears, restarting the frontend dev server is the first thing to try, not a code hunt.
- Stray background `uvicorn`/`npm run dev` processes are easy to accumulate — `netstat -ano` can show a listening PID that `Get-Process`/`taskkill` can't find (socket handle inherited by a child process after the parent exits). If a port seems "stuck", check `tasklist /FI "IMAGENAME eq python.exe"` / `node.exe` for the real PID.
- `supabase/config.toml` needed `npx supabase init --force` once early on (scaffolded config predated the installed CLI's schema). Already fixed, not an issue going forward.

### Next up (in rough priority order)
1. **Merge PR #2**, delete its branch.
2. **Checkout link flow** — `app/checkout/[token]/page.tsx` wired to `/checkout/{token}`, plus generating the token + payment QR on order creation from the back-office "Add order" flow (this is the acknowledged gap noted on `/orders/new`'s success screen).
3. **Promotion engine remaining TODOs** (`backend/app/services/promotions.py`): BOGO buy/get discount math (currently returns ฿0), per-customer coupon redemption limit, reward-coupon auto-issuance on threshold.
4. **Stock decrement on sale** — not implemented; also needs a stock-quantity column (schema currently only has a `status` enum, no quantity) for `status` to auto-derive for real instead of always defaulting to `in_stock`.
5. **Auth** — `get_current_user`/`require_role` are stubs; no login screen exists on the frontend at all yet. Needed before the owner/admin-gated routes (promotions activation, accounting) mean anything.
6. Remaining back-office pages still static/unwired: Inventory inline-edit, Customers, Promotions form, Accounting upload.
7. Dashboard real charts (currently static numbers) — use the `dataviz` skill when tackling this.
8. Minor: `customers` list endpoint logs a (harmless) Pydantic serialization warning — `total_spent_minor` comes back as `Decimal` from the `SUM()` aggregate instead of `int`. Doesn't break anything, just noisy in logs; cast it in `routers/customers.py` if it gets annoying.

### How to resume tomorrow
```
cd D:\Resume\open-pos
npx supabase start                      # starts local Postgres/Auth/Storage
cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload   # port 8000
cd ..\frontend && npm run dev            # port 3000
```
Re-read this file + `docs/requirements.md` §9 for context. Check `gh pr status` / the PR #2 link above first — merge or continue it before branching further.
