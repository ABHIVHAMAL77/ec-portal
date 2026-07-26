"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createTask } from "@/app/actions/tasks";
import { Button } from "./ui";

type Option = { id: string; label: string };

export function NewTaskButton({
  departments,
  people,
  events,
  lockedEvent,
  label = "New task",
}: {
  departments: Option[];
  people: Option[];
  events: Option[];
  lockedEvent?: { id: string; name: string };
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} /> {label}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Create &amp; assign task</h3>
                {lockedEvent && <p className="text-xs text-[var(--text-dim)]">For {lockedEvent.name}</p>}
              </div>
              <button onClick={() => setOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>
            <form
              action={(fd) =>
                start(async () => {
                  const res = await createTask(fd);
                  if (res?.error) setError(res.error);
                  else setOpen(false);
                })
              }
              className="space-y-3"
            >
              <input
                name="title"
                required
                placeholder="Task title…"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
              />
              <div className="grid grid-cols-2 gap-3">
                <select name="departmentId" className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]">
                  <option value="">Department…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
                <select name="assigneeId" className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]">
                  <option value="">Assignee…</option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                {lockedEvent ? (
                  <input type="hidden" name="eventId" value={lockedEvent.id} />
                ) : (
                  <select name="eventId" className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]">
                    <option value="">Event…</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>{e.label}</option>
                    ))}
                  </select>
                )}
                <select name="priority" defaultValue="medium" className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--text-muted)]">Due date</label>
                <input
                  name="dueDate"
                  type="date"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
                />
              </div>
              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Creating…" : "Create task"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
