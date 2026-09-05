"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

// No self-service sign-up here — staff accounts are provisioned manually via Supabase Studio.
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-paper flex justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="font-display italic font-semibold text-xl text-center">
          Open POS
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-border rounded-md p-5 flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5 text-[11px] text-muted">
            Email
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-md border border-border px-3 text-sm text-ink bg-surface"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[11px] text-muted">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-md border border-border px-3 text-sm text-ink bg-surface"
            />
          </label>

          {submitError && (
            <div className="text-xs text-accent border border-accent rounded-lg px-3 py-2">
              {submitError}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
