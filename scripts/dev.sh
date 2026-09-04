#!/usr/bin/env bash
# Starts the backend (FastAPI) and frontend (Next.js) dev servers together.
#
# Assumes Supabase is already running locally (run `supabase start` first,
# see supabase/README.md) and that dependencies are already installed
# (backend virtualenv, `npm install` in frontend/).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  echo "Stopping dev servers..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting backend (FastAPI) on http://localhost:8000 ..."
(cd "$ROOT_DIR/backend" && uvicorn app.main:app --reload) &
BACKEND_PID=$!

echo "Starting frontend (Next.js) on http://localhost:3000 ..."
(cd "$ROOT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
