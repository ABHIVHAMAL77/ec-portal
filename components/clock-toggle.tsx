"use client";

import { useState, useTransition } from "react";
import { LogIn, LogOut, X } from "lucide-react";
import { clockIn, clockOut } from "@/app/actions/attendance";
import { Button } from "./ui";

export function ClockToggle({ isIn }: { isIn: boolean }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState("");
  const [links, setLinks] = useState("");

  function doClockIn() {
    start(() => void clockIn());
  }
  function submitClockOut() {
    start(async () => {
      await clockOut(report, links);
      setReport("");
      setLinks("");
      setOpen(false);
    });
  }

  if (!isIn) {
    return (
      <button
        disabled={pending}
        onClick={doClockIn}
        className="flex items-center gap-2 rounded-lg bg-[var(--success)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        <LogIn size={17} />
        {pending ? "…" : "Clock in"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-[var(--danger)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        <LogOut size={17} /> Clock out
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Clock out — what did you work on?</h3>
              <button onClick={() => setOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-[var(--text-muted)]">What you did</label>
                <textarea
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  rows={4}
                  placeholder="e.g. Finished PMNC key visuals v2, edited highlight reel, prepped caster script…"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-muted)]">Links (optional)</label>
                <textarea
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  rows={2}
                  placeholder="Drive / Figma / stream links, one per line"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              <p className="text-xs text-[var(--text-dim)]">
                This is saved to your work log and shown in Finance &amp; Requests.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={submitClockOut} disabled={pending} variant="danger" className="flex-1">
                  {pending ? "Clocking out…" : "Clock out"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
