"""
Application configuration.

All settings are read from environment variables (via pydantic-settings).
The actual `.env` / `.env.example` file lives at the REPO ROOT and is owned
by another workstream — this backend does not create or ship its own env
file, it only declares what it expects to find in the process environment.

Expected environment variables
-------------------------------
DATABASE_URL
    Async SQLAlchemy connection string for the Supabase-hosted Postgres
    instance, e.g.:
    postgresql+asyncpg://<user>:<password>@<host>:<port>/<db>
    This is used for direct Postgres access (joins/aggregates for the
    promotion engine, order totals, dashboard analytics, bank-statement
    reconciliation) rather than going through Supabase's REST/PostgREST
    layer.

SUPABASE_URL
    Base URL of the Supabase project, e.g. https://<project-ref>.supabase.co
    Used for Supabase Auth (staff login) integration — see core/security.py.

SUPABASE_ANON_KEY
    Public/anon API key for the Supabase project. Would be used client-side
    and, on the backend, only for operations that should run under RLS as
    an anonymous/unauthenticated user (rare on this service).

SUPABASE_SERVICE_ROLE_KEY
    Secret service-role key for the Supabase project. Grants elevated
    access bypassing RLS — required for verifying JWTs / admin auth
    operations server-side. Never expose this to the frontend.

FRONTEND_ORIGIN
    Origin (scheme + host [+ port]) of the deployed frontend, used to
    configure CORS in app/main.py, e.g. https://app.example.com or
    http://localhost:5173 for local dev.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings, populated from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Database -----------------------------------------------------
    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/open_pos"
    )

    # --- Supabase -------------------------------------------------------
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # --- CORS / frontend --------------------------------------------------
    FRONTEND_ORIGIN: str = "http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (avoids re-parsing env on every call)."""
    return Settings()


settings = get_settings()
