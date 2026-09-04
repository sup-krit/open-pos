"""
Auth extension points.

Staff authentication is provided by Supabase Auth on the frontend; the
backend's job is to verify the bearer token Supabase issues and resolve it
to a staff user + role. That verification is NOT implemented yet — both
dependencies below are stubs so routers can already be wired up against the
final shape of the dependency graph.

TODO (real implementation):
    - Extract the `Authorization: Bearer <jwt>` header.
    - Verify the JWT signature against Supabase's JWKS (or verify via the
      Supabase service-role client), checking `exp`/`aud`/`iss`.
    - Look up / hydrate a local `StaffUser` (id, email, role) from the
      token's `sub` claim.
    - Raise HTTP 401 for missing/invalid/expired tokens.
"""

from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    """Placeholder shape for the authenticated staff user."""

    id: str
    email: str
    role: str  # e.g. "staff" | "owner_admin"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    """
    Dependency stub for resolving the current authenticated staff user.

    TODO: Replace this placeholder with real Supabase JWT verification.
    For now this either:
      - returns a placeholder "staff" user so downstream routers/tests can
        run end-to-end without a real auth flow, or
      - raises 401 if no bearer token was supplied at all.

    Real implementation should verify `credentials.credentials` as a
    Supabase-issued JWT and raise HTTPException(401) on failure.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated (Supabase JWT verification not yet implemented).",
        )

    # TODO: verify credentials.credentials against Supabase JWKS / auth API.
    return CurrentUser(id="00000000-0000-0000-0000-000000000000", email="staff@example.com", role="staff")


def require_role(role: str):
    """
    Dependency factory stub for role-gated routes (e.g. owner/admin-only
    endpoints such as promotion activation and accounting).

    TODO: Once get_current_user does real JWT verification, compare
    `current_user.role` against `role` (and/or a role hierarchy) and raise
    HTTPException(403) when it doesn't satisfy the requirement.
    """

    async def _require_role(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        # TODO: real role check, e.g.:
        # if current_user.role != role and current_user.role != "owner_admin":
        #     raise HTTPException(status_code=403, detail="Insufficient role")
        return current_user

    return _require_role
