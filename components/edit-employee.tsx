"use client";

import { useState, useTransition } from "react";
import { Pencil, X } from "lucide-react";
import { updateEmployee, setEmployeeStatus } from "@/app/actions/people";

type Option = { id: string; label: string };
export type EditMember = {
  id: string;
  fullName: string;
  email: string;
  jobRole: string;
  departmentId: string | null;
  accessLevel: string;
  employmentType: string;
  reportsToId: string | null;
  fullAccess: boolean;
  status: string;
};

export function EditEmployeeButton({
  member,
  departments,
  people,
}: {
  member: EditMember;
  departments: Option[];
  people: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const input =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]";
  const inactive = member.status === "inactive";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Edit"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
      >
        <Pencil size={13} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Edit {member.fullName}</h3>
              <button onClick={() => setOpen(false)} className="text-[var(--text-dim)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            <form
              action={(fd) =>
                start(async () => {
                  setError(null);
                  const res = await updateEmployee(member.id, fd);
                  if (res?.error) setError(res.error);
                  else setOpen(false);
                })
              }
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">Full name *</label>
                  <input name="fullName" required defaultValue={member.fullName} className={input} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">Work email *</label>
                  <input name="email" type="email" required defaultValue={member.email} className={input} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">Job role</label>
                  <input name="jobRole" defaultValue={member.jobRole} className={input} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">Department</label>
                  <select name="departmentId" defaultValue={member.departmentId ?? ""} className={input}>
                    <option value="">—</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">Employment</label>
                  <select name="employmentType" defaultValue={member.employmentType} className={input}>
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">Access level</label>
                  <select name="accessLevel" defaultValue={member.accessLevel} className={input}>
                    <option value="member">Member (own work only)</option>
                    <option value="manager">Dept. head (their department)</option>
                    <option value="admin">Admin (everything)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">Reports to</label>
                  <select name="reportsToId" defaultValue={member.reportsToId ?? ""} className={input}>
                    <option value="">—</option>
                    {people.filter((p) => p.id !== member.id).map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">Reset password</label>
                  <input name="password" placeholder="leave blank to keep" className={input} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 rounded-lg bg-[var(--bg-elev)] px-3 py-2.5">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isDeptHead" className="accent-[var(--brand)]" />
                  Make this person the head of their department
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="fullAccess" defaultChecked={member.fullAccess} className="accent-[var(--brand)]" />
                  Full access — sees everything company-wide (COO)
                </label>
              </div>

              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await setEmployeeStatus(member.id, inactive ? "active" : "inactive");
                      setOpen(false);
                    })
                  }
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    inactive
                      ? "border-[var(--success)] text-[var(--success)]"
                      : "border-[var(--danger)] text-[var(--danger)]"
                  }`}
                >
                  {inactive ? "Reactivate" : "Deactivate"}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[#17130a] disabled:opacity-50"
                >
                  {pending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
