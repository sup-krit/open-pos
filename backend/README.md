# Open POS — Backend

FastAPI service for the Open POS backend/back-office system. Talks directly
to a Supabase-hosted PostgreSQL database via SQLAlchemy (async) + asyncpg
for business logic that needs joins/aggregates (promotion engine, order
totals, dashboard analytics, bank-statement parsing).

## Requirements

- Python 3.11+
- A reachable Postgres database (Supabase-hosted in this project)

## Install

```bash
cd backend
pip install -e .
```

(or `pip install fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" asyncpg pydantic pydantic-settings python-dotenv`
if you'd rather not install this as an editable package.)

## Configuration

This service reads its configuration from environment variables (see
`app/core/config.py` for the full list: `DATABASE_URL`, `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_ORIGIN`).

The actual `.env` / `.env.example` file is owned by the repo root (a
separate workstream) — this directory intentionally does not ship its own
copy. Point your shell/environment at the repo-root env file, or export the
variables above manually, before running the server.

## Run

```bash
uvicorn app.main:app --reload
```

The API is served at `http://localhost:8000` by default, with routers
mounted under `/api/*` (e.g. `/api/products`, `/api/orders`,
`/api/customers`, `/api/promotions`, `/api/accounting`, `/api/dashboard`)
plus the public, unauthenticated `/checkout/{token}` flow. A health check
is available at `GET /health`.

## Status

This is a scaffold, not a full implementation. See inline `# TODO` markers
throughout `app/` for what's stubbed vs. real — in short:

- **Real, working against the DB:** `products` CRUD, `orders` create/list/
  get/patch (including the tracking-number -> shipping_status auto-flip),
  `customers` CRUD with derived `total_orders`/`total_spent`, most of
  `dashboard` (sales trend, top products, channel breakdown, payment mix,
  geography, gross margin), `accounting` transaction listing and
  monthly-summary aggregation.
- **Partially implemented:** the promotion engine
  (`app/services/promotions.py`) — candidate gathering, date-window and
  coupon-gating filters, condition checks, stacking/priority resolution,
  and percent/fixed discount math are implemented; BOGO product/group
  targeting, per-customer coupon redemption limits, and reward-coupon
  issuance are explicit `# TODO`s.
- **Stubbed:** bank-statement PDF parsing
  (`app/services/accounting.py::parse_statement`, raises
  `NotImplementedError`), Supabase JWT verification
  (`app/core/security.py::get_current_user` / `require_role`), customer
  segmentation and promotion-performance dashboard widgets.
