"use client";

import { useState, useTransition } from "react";
import { Target, Check, Trash2, Plus } from "lucide-react";
import { addKpi, toggleKpi, deleteKpi } from "@/app/actions/kpi";
import { Avatar, Badge } from "./ui";

type Kpi = {
  id: string;
  title: string;
  target: string | null;
  status: string;
  assignee: { fullName: string; avatarColor: string } | null;
};
type Person = { id: string; label: string };

export function KpiBoard({
  eventId,
  kpis,
  people,
  canEdit,
  currentUserId,
}: {
  eventId: string;
  kpis: Kpi[];
  people: Person[];
  canEdit: boolean;
  currentUserId: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      {kpis.length === 0 && <p className="text-sm text-[var(--text-dim)]">No KPIs set yet.</p>}

      {kpis.map((k) => {
        const canToggle = canEdit || k.assignee !== null; // assignee check done server-side
        return (
          <div key={k.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2.5">
            <button
              disabled={pending || !canToggle}
              onClick={() => start(() => void toggleKpi(k.id))}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                k.status === "done" ? "border-[var(--success)] bg-[var(--success)]" : "border-[var(--text-dim)]"
              }`}
              title="Toggle done"
            >
              {k.status === "done" ? <Check size={13} className="text-white" /> : <Target size={13} className="text-[var(--text-dim)]" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${k.status === "done" ? "text-[var(--text-dim)] line-through" : ""}`}>{k.title}</p>
              {k.assignee && <p className="text-xs text-[var(--text-dim)]">{k.assignee.fullName}</p>}
            </div>
            {k.target && <Badge color="var(--brand-2)">{k.target}</Badge>}
            {k.assignee && <Avatar name={k.assignee.fullName} color={k.assignee.avatarColor} size={26} />}
            {canEdit && (
              <button onClick={() => start(() => void deleteKpi(k.id))} disabled={pending} className="text-[var(--text-dim)] hover:text-[var(--danger)]">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      })}

      {canEdit && (
        <form
          action={(fd) => {
            fd.set("eventId", eventId);
            start(async () => {
              await addKpi(fd);
              (document.getElementById(`kpi-form-${eventId}`) as HTMLFormElement)?.reset();
            });
          }}
          id={`kpi-form-${eventId}`}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[var(--border)] p-2"
        >
          <input name="title" required placeholder="KPI (e.g. Peak viewers)" className="min-w-[160px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1.5 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="target" placeholder="Target" className="w-24 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1.5 text-sm outline-none focus:border-[var(--brand)]" />
          <select name="assigneeId" className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1.5 text-sm outline-none focus:border-[var(--brand)]">
            <option value="">Owner…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <button type="submit" disabled={pending} className="flex items-center gap-1 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
            <Plus size={15} /> Add
          </button>
        </form>
      )}
    </div>
  );
}
