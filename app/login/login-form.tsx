"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null as { error?: string } | null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Work email</label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@esportscounty.com"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-dim)] focus:border-[var(--brand)]"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">Password</label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-dim)] focus:border-[var(--brand)]"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in to portal"}
      </Button>
    </form>
  );
}
