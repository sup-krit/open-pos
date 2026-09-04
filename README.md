# Open POS

Open POS is a single-brand retail point-of-sale and back-office system: checkout/register flows, inventory and product management, and reporting, backed by a REST API and a managed Postgres database.

> **Portfolio project.** This is a skill demonstration built for a personal portfolio — it is not commissioned by, built for, or affiliated with any real business. No real client or brand names are used anywhere in this repository.

## Tech stack

| Layer            | Technology                                  | Notes                          |
|-------------------|----------------------------------------------|---------------------------------|
| Frontend          | Next.js (App Router) + Tailwind CSS          | Deployed to Vercel              |
| Backend API       | Python + FastAPI                             | REST API                        |
| Database / Auth / Storage | PostgreSQL via Supabase               | Local dev via Supabase CLI      |

## Repo layout

```
frontend/   Next.js (App Router) + Tailwind CSS web app
backend/    FastAPI application (REST API)
supabase/   Supabase project config, migrations, and local dev setup
docs/       Requirements, architecture/flow diagrams, and UX wireframes
  requirements.md
  diagrams/         architecture & flow diagrams
  ux/wireframes/     UX wireframes
```

Each of `frontend/`, `backend/`, and `supabase/` has its own README with setup and usage details specific to that part of the stack.

## Getting started

1. **Start Supabase locally** — see `supabase/README.md`, or run:
   ```
   supabase start
   ```
2. **Start the backend API**:
   ```
   cd backend
   uvicorn app.main:app --reload
   ```
   See `backend/README.md` for environment setup and dependency installation.
3. **Start the frontend**:
   ```
   cd frontend
   npm install
   npm run dev
   ```
   See `frontend/README.md` for details.

Alternatively, once dependencies are installed and Supabase is running, `scripts/dev.sh` will start the backend and frontend together for local development.

### Environment variables

All environment variables used across the project are documented in the root [`.env.example`](./.env.example). Copy the values you need into `frontend/.env.local` and `backend/.env` (each subproject's README explains exactly which variables it consumes).

## Project docs

- [`docs/requirements.md`](./docs/requirements.md) — product/functional requirements
- `docs/diagrams/` — architecture and flow diagrams
- `docs/ux/wireframes/` — UX wireframes
