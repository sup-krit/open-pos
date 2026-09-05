"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Client-side route guard: redirects to /login when there's no Supabase
// session. `ready` stays false while the initial check is in flight so
// callers can avoid flashing protected content.
export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT" || !session) {
        setReady(false);
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return { ready };
}

// Route guard combining useRequireAuth's session check with a role check —
// redirects to /login with no session, or /dashboard when the session's role
// doesn't match. Still UX-only gating; the backend's require_role on the
// verified JWT is the real enforcement.
export function useRequireRole(requiredRole: "owner_admin") {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    function evaluate(session: Session | null) {
      if (!active) return;
      if (!session) {
        setReady(false);
        router.replace("/login");
        return;
      }
      const role = session.user.app_metadata?.role === "owner_admin" ? "owner_admin" : "staff";
      if (role !== requiredRole) {
        setReady(false);
        router.replace("/dashboard");
        return;
      }
      setReady(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => evaluate(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        setReady(false);
        router.replace("/login");
        return;
      }
      evaluate(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, requiredRole]);

  return { ready };
}

// UX-only role read for hiding nav items — NOT a security boundary. The
// backend's require_role on the verified JWT is the real enforcement.
export function useCurrentRole(): "staff" | "owner_admin" {
  const [role, setRole] = useState<"staff" | "owner_admin">("staff");

  useEffect(() => {
    let active = true;

    function applyRole(session: Session | null) {
      const value = session?.user?.app_metadata?.role;
      setRole(value === "owner_admin" ? "owner_admin" : "staff");
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      applyRole(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      applyRole(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return role;
}
