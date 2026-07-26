"use client";

import { useState, useTransition } from "react";
import { UserPlus, X } from "lucide-react";
import { createEmployee } from "@/app/actions/people";
import { Button } from "./ui";

type Option = { id: string; label: string };

export function AddEmployeeButton({
  departments,
  people,
}: {
  departments: Option[];
  people: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const input =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus size={16} /> Add employee
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Add employee</h3>
              <button onClick={() => setOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            {done ? (
              <div className="space-y-3">
                <p className="rounded-lg bg-[var(--success)]/10 px-3 py-3 text-sm text-[var(--success)]">
                  ✅ {done} added. They can log in with the temporary password you set.
                </p>
                <Button
                  onClick={() => {
                    setDone(null);
                  }}
                  className="w-full"
                >
                  Add another
                </Button>
                <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
                  Done
                </Button>
              </div>
            ) : (
              <form
                action={(fd) =>
                  start(async () => {
                    setError(null);
                    const res = await createEmployee(fd);
                    if (res?.error) setError(res.error);
                    else setDone(String(fd.get("fullName")));
                  })
                }
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">Full name *</label>
                    <input name="fullName" required placeholder="e.g. Ravi Sharma" className={input} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">Work email *</label>
                    <input name="email" type="email" required placeholder="ravi@esportscounty.com" className={input} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">Job role</label>
                    <input name="jobRole" placeholder="e.g. Video Editor" className={input} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">Department</label>
                    <select name="departmentId" className={input}>
                      <option value="">—</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">Employment</label>
                    <select name="employmentType" defaultValue="full_time" className={input}>
                      <option value="full_time">Full-time</option>
                      <option value="part_time">Part-time</option>
                      <option value="freelancer">Freelancer</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">Access level</label>
                    <select name="accessLevel" defaultValue="member" className={input}>
                      <option value="member">Member (own work only)</option>
                      <option value="manager">Dept. head (their department)</option>
                      <option value="admin">Admin (everything)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">Reports to</label>
                    <select name="reportsToId" className={input}>
                      <option value="">—</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[var(--text-muted)]">Temp password</label>
                    <input name="password" defaultValue="esports123" className={input} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 rounded-lg bg-[var(--bg-elev)] px-3 py-2.5">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isDeptHead" className="accent-[var(--brand)]" />
                    Make this person the head of their department
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="fullAccess" className="accent-[var(--brand)]" />
                    Full access — sees everything company-wide (COO)
                  </label>
                </div>

                {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? "Adding…" : "Add employee"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
