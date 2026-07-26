"use client";

import { useState, useTransition } from "react";
import { Plus, X, Check, Ban } from "lucide-react";
import { createManpowerRequest, decideManpower } from "@/app/actions/manpower";
import { Button, Badge } from "./ui";

export type Req = {
  id: string;
  roleNeeded: string;
  count: number;
  reason: string | null;
  budgetNote: string | null;
  status: string;
  requestedBy: { fullName: string };
  department: { name: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444",
};

export function NewManpowerButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} /> Request manpower
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Request manpower</h3>
              <button onClick={() => setOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>
            <form
              action={(fd) =>
                start(async () => {
                  const res = await createManpowerRequest(fd);
                  if (res?.error) setError(res.error);
                  else setOpen(false);
                })
              }
              className="space-y-3"
            >
              <input name="roleNeeded" required placeholder="Role needed (e.g. Freelance Observer)" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              <input name="count" type="number" min={1} defaultValue={1} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              <textarea name="reason" rows={2} placeholder="Why is this needed?" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              <input name="budgetNote" placeholder="Budget note (optional)" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
              <p className="text-xs text-[var(--text-dim)]">Goes to the Finance Manager for approval.</p>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Sending…" : "Send request"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function ManpowerRow({ req, canDecide }: { req: Req; canDecide: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {req.count}× {req.roleNeeded}
        </p>
        <p className="text-xs text-[var(--text-dim)]">
          {req.requestedBy.fullName}
          {req.department ? ` · ${req.department.name}` : ""}
          {req.reason ? ` — ${req.reason}` : ""}
        </p>
      </div>
      {canDecide && req.status === "pending" ? (
        <div className="flex gap-1.5">
          <button
            disabled={pending}
            onClick={() => start(() => void decideManpower(req.id, "approved"))}
            className="flex items-center gap-1 rounded-lg bg-[var(--success)] px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            <Check size={14} /> Approve
          </button>
          <button
            disabled={pending}
            onClick={() => start(() => void decideManpower(req.id, "rejected"))}
            className="flex items-center gap-1 rounded-lg border border-[var(--danger)] px-2.5 py-1.5 text-xs font-medium text-[var(--danger)] disabled:opacity-50"
          >
            <Ban size={14} /> Reject
          </button>
        </div>
      ) : (
        <Badge color={STATUS_COLOR[req.status]}>{req.status}</Badge>
      )}
    </div>
  );
}
