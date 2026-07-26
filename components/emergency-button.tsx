"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, X } from "lucide-react";
import { raiseEscalation } from "@/app/actions/escalation";
import { Button } from "./ui";

export function EmergencyButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"emergency" | "non_emergency">("emergency");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      const res = await raiseEscalation(type, message);
      if (res?.ok) {
        setDone(true);
        setMessage("");
        setTimeout(() => {
          setDone(false);
          setOpen(false);
        }, 1600);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-1.5 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger)]/20"
      >
        <AlertTriangle size={16} />
        <span className="hidden sm:inline">Emergency</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={18} className="text-[var(--danger)]" />
                Raise an issue
              </h3>
              <button onClick={() => setOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            {done ? (
              <p className="rounded-lg bg-[var(--success)]/10 px-3 py-6 text-center text-sm text-[var(--success)]">
                Sent to the Operations Manager. ✅
              </p>
            ) : (
              <>
                <div className="mb-3 flex gap-2">
                  <button
                    onClick={() => setType("emergency")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                      type === "emergency"
                        ? "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]"
                        : "border-[var(--border)] text-[var(--text-muted)]"
                    }`}
                  >
                    Emergency (now)
                  </button>
                  <button
                    onClick={() => setType("non_emergency")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                      type === "non_emergency"
                        ? "border-[var(--brand)] bg-[var(--brand)]/10 text-[var(--text)]"
                        : "border-[var(--border)] text-[var(--text-muted)]"
                    }`}
                  >
                    Discuss at meeting
                  </button>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Describe the issue…"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                />
                <p className="mt-2 text-xs text-[var(--text-dim)]">
                  Emergency issues alert the Operations Manager immediately. Non-emergencies are
                  queued for the next meeting.
                </p>
                <Button onClick={submit} disabled={pending || !message.trim()} className="mt-3 w-full">
                  {pending ? "Sending…" : "Send"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
