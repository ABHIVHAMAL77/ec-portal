"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { updateTaskStatus } from "@/app/actions/tasks";
import { TASK_STATUSES, TASK_STATUS_LABEL, PRIORITY_COLOR } from "@/lib/constants";
import { Avatar, Badge } from "./ui";
import { relativeDay } from "@/lib/utils";

export type BoardTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { fullName: string; avatarColor: string } | null;
  department: { name: string; color: string } | null;
  event: { name: string } | null;
};

const COLUMN_ACCENT: Record<string, string> = {
  todo: "#646d7e",
  in_progress: "#6b8cc4",
  review: "#d6a43e",
  done: "#35b06a",
};

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  const [items, setItems] = useState(tasks);
  const [pending, start] = useTransition();

  function move(id: string, dir: -1 | 1) {
    const task = items.find((t) => t.id === id);
    if (!task) return;
    const idx = TASK_STATUSES.indexOf(task.status as (typeof TASK_STATUSES)[number]);
    const next = TASK_STATUSES[idx + dir];
    if (!next) return;
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));
    start(() => void updateTaskStatus(id, next));
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {TASK_STATUSES.map((status) => {
        const colTasks = items.filter((t) => t.status === status);
        return (
          <div key={status} className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]/50">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLUMN_ACCENT[status] }} />
                <span className="text-sm font-semibold">{TASK_STATUS_LABEL[status]}</span>
              </div>
              <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-xs text-[var(--text-dim)]">
                {colTasks.length}
              </span>
            </div>
            <div className="flex-1 space-y-2 p-3">
              {colTasks.length === 0 && (
                <p className="py-6 text-center text-xs text-[var(--text-dim)]">No tasks</p>
              )}
              {colTasks.map((t) => {
                const idx = TASK_STATUSES.indexOf(status);
                const overdue = t.dueDate && new Date(t.dueDate) < new Date() && status !== "done";
                return (
                  <div key={t.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3">
                    <div className="flex items-start gap-1.5">
                      <GripVertical size={14} className="mt-0.5 shrink-0 text-[var(--text-dim)]" />
                      <Link href={`/tasks/${t.id}`} className="flex-1 text-sm font-medium leading-snug hover:text-[var(--brand-2)]">
                        {t.title}
                      </Link>
                    </div>
                    {t.event && <p className="mt-1 pl-5 text-xs text-[var(--text-dim)]">{t.event.name}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-5">
                      <Badge color={PRIORITY_COLOR[t.priority]}>{t.priority}</Badge>
                      {t.department && <Badge color={t.department.color}>{t.department.name}</Badge>}
                      {t.dueDate && (
                        <span className={`text-xs ${overdue ? "text-[var(--danger)]" : "text-[var(--text-dim)]"}`}>
                          {relativeDay(t.dueDate)}
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between pl-5">
                      {t.assignee ? (
                        <Avatar name={t.assignee.fullName} color={t.assignee.avatarColor} size={24} />
                      ) : (
                        <span className="text-xs text-[var(--text-dim)]">Unassigned</span>
                      )}
                      <div className="flex gap-1">
                        <button
                          disabled={idx === 0 || pending}
                          onClick={() => move(t.id, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] disabled:opacity-30"
                          title="Move back"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          disabled={idx === TASK_STATUSES.length - 1 || pending}
                          onClick={() => move(t.id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] disabled:opacity-30"
                          title="Move forward"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
