# Open POS — Database (Supabase / PostgreSQL)

This directory contains the database schema and local dev tooling for Open
POS, scaffolded with the Supabase CLI. It is a portfolio project (no real
client, no real data).

## Contents

```
supabase/
  config.toml          Supabase CLI local-dev configuration
  migrations/
    0001_init.sql       Full initial schema (tables, indexes, triggers, RLS)
  seed.sql              Sample data for local dev/demo
```

## Running locally

### Option A — Supabase CLI (recommended)

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker
Desktop installed.

```bash
# from the repo root
supabase start
```

`supabase start` boots the local stack (Postgres, Studio, Auth, Storage,
etc.) and automatically applies everything in `migrations/`.

To apply migrations **and** seed data in one shot (this drops and recreates
the local database):

```bash
supabase db reset
```

Studio will be available at the port configured in `config.toml`
(`http://127.0.0.1:54323` by default).

### Option B — plain `psql`

If the Supabase CLI isn't installed, you can apply the schema directly
against any Postgres instance (local or a Supabase project) with `psql`:

```bash
psql "$DATABASE_URL" -f migrations/0001_init.sql
psql "$DATABASE_URL" -f seed.sql
```

## Environment variables

Connection details (`SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`) are documented in the
repo-root `.env.example`, owned by another part of this project — they are
intentionally not duplicated here.

## Notes on the schema

- All money columns are `bigint` storing integer minor units (e.g. satang,
  not baht) — never `numeric`/`float` — per project non-functional
  requirements.
- All primary keys are `uuid` (via `pgcrypto`'s `gen_random_uuid()`).
- All timestamp columns are `timestamptz`.
- Every table with an `updated_at` column has it auto-maintained by a shared
  `set_updated_at()` trigger.
- Row Level Security is enabled on every table with straightforward,
  first-pass placeholder policies (any `authenticated` user can read/write;
  `service_role` can do anything). Real staff/owner/admin roles aren't wired
  up yet — see the `TODO(roles)` comments in `migrations/0001_init.sql`,
  particularly around `promotions` and `accounting_transactions`, which will
  eventually need write access restricted to owner/admin.
- `orders.shipping_status` is documented as deriving from `tracking_number`
  being set, but that derivation is enforced at the application layer for
  now, not via a DB trigger.
