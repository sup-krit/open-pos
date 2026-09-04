# Starts the backend (FastAPI) and frontend (Next.js) dev servers together.
#
# Assumes Supabase is already running locally (run `supabase start` first,
# see supabase/README.md) and that dependencies are already installed
# (backend virtualenv, `npm install` in frontend/).

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot

Write-Host "Starting backend (FastAPI) on http://localhost:8000 ..."
$backend = Start-Process -PassThru -NoNewWindow powershell -ArgumentList "-NoProfile", "-Command", "cd '$RootDir\backend'; uvicorn app.main:app --reload"

Write-Host "Starting frontend (Next.js) on http://localhost:3000 ..."
$frontend = Start-Process -PassThru -NoNewWindow powershell -ArgumentList "-NoProfile", "-Command", "cd '$RootDir\frontend'; npm run dev"

try {
    Wait-Process -Id $backend.Id, $frontend.Id
}
finally {
    Write-Host "Stopping dev servers..."
    Stop-Process -Id $backend.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -ErrorAction SilentlyContinue
}
