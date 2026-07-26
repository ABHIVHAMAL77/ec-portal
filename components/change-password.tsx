"use client";

import { useState, useTransition } from "react";
import { changeOwnPassword } from "@/app/actions/people";
import { Button } from "./ui";

export function ChangePassword() {
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const input =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

  function submit() {
    setError(null);
    setDone(false);
    if (next !== confirm) {
      setError("The new passwords don't match.");
      return;
    }
    start(async () => {
      const res = await changeOwnPassword(current, next);
      if (res?.error) setError(res.error);
      else {
        setDone(true);
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    });
  }

  return (
    <div className="max-w-sm space-y-3">
      <div>
        <label className="mb-1 block text-xs text-[var(--text-muted)]">Current password</label>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--text-muted)]">New password</label>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={input} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--text-muted)]">Confirm new password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {done && <p className="text-sm text-[var(--success)]">✅ Password changed.</p>}
      <Button onClick={submit} disabled={pending || !current || !next}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </div>
  );
}
