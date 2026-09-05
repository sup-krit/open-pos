"""
Auth extension points.

Staff authentication is provided by Supabase Auth on the frontend; the
backend's job is to verify the bearer token Supabase issues and resolve it
to a staff user + role.
"""

from dataclasses import dataclass
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def _get_jwks_client() -> jwt.PyJWKClient:
    """Lazily build (and memoize) the JWKS client on first use, so importing
    this module doesn't fail when SUPABASE_URL isn't set yet (e.g. no .env)."""
    return jwt.PyJWKClient(f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json")


@dataclass
class CurrentUser:
    """Placeholder shape for the authenticated staff user."""

    id: str
    email: str
    role: str  # e.g. "staff" | "owner_admin"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    """Dependency resolving the current authenticated staff user from a Supabase JWT."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        # Local Supabase CLI defaults to asymmetric (ES256) JWKS-based signing;
        # some hosted projects still use the legacy shared HS256 secret. Branch
        # on the token header so both are supported.
        if jwt.get_unverified_header(credentials.credentials).get("alg") == "HS256":
            claims = jwt.decode(
                credentials.credentials,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            signing_key = _get_jwks_client().get_signing_key_from_jwt(credentials.credentials)
            claims = jwt.decode(
                credentials.credentials,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience="authenticated",
            )
    except jwt.PyJWTError:  # includes PyJWKClientError (JWKS fetch/lookup failures)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Default to least-privilege "staff" when the role claim is absent.
    return CurrentUser(
        id=claims["sub"],
        email=claims.get("email", ""),
        role=(claims.get("app_metadata") or {}).get("role", "staff"),
    )


def require_role(role: str):
    """Dependency factory for role-gated routes (e.g. owner/admin-only endpoints)."""

    async def _require_role(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        # owner_admin satisfies any role requirement.
        if current_user.role != "owner_admin" and current_user.role != role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return current_user

    return _require_role
