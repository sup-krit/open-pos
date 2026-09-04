# Progress log

## 2026-09-04 — 2026-09-05

### Done
- `docs/requirements.md` — full SRS (single-brand scope, all decisions locked: BOGO/coupon/reward-coupon, dashboard analytics breakdowns, extensibility for other business types).
- `docs/diagrams/` — 8 diagrams (architecture, ER, POS flow, order lifecycle, inventory flow, promotion evaluation, checkout-token sequence, bank reconciliation), HTML+SVG.
- `docs/ux/wireframes/` — 8-artboard Claude Design canvas, hi-fi "Warm Editorial" palette (paper #FAF7F2 / ink #241F1A / accent #C2542E, Newsreader+Work Sans). Published: https://claude.ai/code/artifact/84474527-2748-4141-acc3-b5e7bf41a5da
- Full scaffold: `frontend/` (Next.js 15/Tailwind), `backend/` (FastAPI), `supabase/` (Postgres schema+seed+RLS), root tooling. Pushed to https://github.com/poomrs444/open-pos (branch `master`, initial commit `397805a`).
- Local dev environment working end-to-end: `supabase start` running, `backend/.env` + `frontend/.env.local` wired to local Supabase, backend verified against real Postgres.
- **POS/Sell screen wired to real backend** (`frontend/app/pos/page.tsx` + `frontend/lib/api.ts`): live product search, real cart, live promotion evaluation (`POST /api/promotions/evaluate`), real order creation (`POST /api/orders`), e-receipt from the real response. Tested end-to-end in browser — works.
- **Bug fixed**: `GET /api/orders` 500'd on `ResponseValidationError` — `payment_method` is nullable in the DB migration but was declared non-null in the SQLAlchemy model + Pydantic schema. Fixed in `backend/app/models/order.py` + `backend/app/schemas/order.py` (not yet committed — see below).

### Not committed yet
- `backend/app/models/order.py`, `backend/app/schemas/order.py` (the `payment_method` nullable fix)
- `frontend/lib/api.ts` (new file)
- `frontend/app/pos/page.tsx` (rewritten)
- `backend/.env`, `frontend/.env.local` are gitignored on purpose — don't commit, just recreate from `.env.example` + `npx supabase status` if a fresh machine picks this up.

### Known local dev quirks hit today (informational, not action items)
- Stray background `uvicorn`/`npm run dev` processes are easy to accumulate across turns in this Windows/Git-Bash setup — `netstat -ano` can show a listening PID that Windows `Get-Process`/`taskkill` can't find (socket handle inherited by a child process after the parent exits). If a port seems "stuck", check `tasklist /FI "IMAGENAME eq python.exe"` / `node.exe` for the real PID rather than trusting netstat's owner column.
- `supabase/config.toml` needed `npx supabase init --force` once (backend agent's scaffolded config predated the installed CLI's schema — `[inbucket]` deprecated warning). Already fixed, no action needed.

### Next up (in rough priority order)
1. **Commit the POS-wiring changes** (models/order.py, schemas/order.py, lib/api.ts, app/pos/page.tsx).
2. **Orders back-office page** — wire `app/(back-office)/orders/page.tsx` + `orders/[id]/page.tsx` to real `/api/orders` (list, detail, tracking-number patch → auto-ships).
3. **Checkout link flow** — `app/checkout/[token]/page.tsx` wired to `/checkout/{token}` (address save), plus generating the token + payment QR on order creation from the back-office "Add order" flow (POS flow doesn't need this — it's for the online/asynchronous order path).
4. **Promotion engine TODOs** (`backend/app/services/promotions.py`): BOGO buy/get discount math (currently returns ฿0), per-customer coupon redemption limit, reward-coupon auto-issuance on threshold.
5. **Stock decrement on sale** — not implemented yet; POS/order creation doesn't touch inventory quantity (also: schema has no stock-quantity column yet, only a `status` enum — needs a migration).
6. **Auth** — `get_current_user`/`require_role` are stubs; no login screen exists on the frontend at all yet. Needed before the owner/admin-gated routes (promotions activation, accounting) mean anything.
7. Remaining back-office pages (Inventory inline-edit, Customers, Promotions form, Accounting upload) still static/unwired.
8. Dashboard real charts (currently static numbers) — use the `dataviz` skill when tackling this.

### How to resume tomorrow
```
cd D:\Resume\open-pos
npx supabase start                      # if not already running
cd backend && .venv\Scripts\activate && uvicorn app.main:app --reload   # port 8000
cd ..\frontend && npm run dev            # port 3000 (or check for a stray process first)
```
Then re-read this file + `docs/requirements.md` §9 for context before continuing.
