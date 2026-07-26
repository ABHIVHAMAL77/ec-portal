"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createEvent } from "@/app/actions/events";
import { Button } from "@/components/ui";

export function NewEventButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} /> Create event
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Create a new event</h3>
              <button onClick={() => setOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>
            <form
              action={(fd) =>
                start(async () => {
                  const res = await createEvent(fd);
                  if (res?.error) setError(res.error);
                })
              }
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-sm text-[var(--text-muted)]">Event name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. PMNC SA Spring 2026"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-muted)]">Game title</label>
                <input
                  name="gameTitle"
                  placeholder="e.g. PUBG Mobile"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-muted)]">Type</label>
                <select
                  name="type"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                >
                  <option value="tournament">Tournament</option>
                  <option value="watchparty">Watchparty</option>
                  <option value="show">Show</option>
                </select>
              </div>
              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
              <p className="text-xs text-[var(--text-dim)]">
                Creates the event in <b>Planning</b>. Next, add KPIs and a to-do list for the team.
              </p>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Creating…" : "Create event"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
