import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { relativeDay } from "@/lib/utils";
import { EVENT_STAGE_LABEL, EVENT_STAGE_COLOR, PRIORITY_COLOR } from "@/lib/constants";
import { Card, CardHeader, Badge, Avatar, Stat, EmptyState, Dot } from "@/components/ui";
import { taskWhere, eventWhere, canSeeAll } from "@/lib/access";
import { CheckSquare, CalendarDays, Target, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const tWhere = taskWhere(user);
  const eWhere = eventWhere(user);
  const seesAll = canSeeAll(user);

  const [myTasks, myKpis, liveEvents, workingNow, counts] = await Promise.all([
    prisma.task.findMany({
      where: { assigneeId: user.id, status: { not: "done" } },
      orderBy: [{ dueDate: "asc" }],
      take: 6,
      include: { event: true },
    }),
    prisma.kpi.findMany({
      where: { assigneeId: user.id },
      orderBy: { createdAt: "asc" },
      take: 6,
      include: { event: { select: { name: true } } },
    }),
    prisma.event.findMany({
      where: { AND: [{ lifecycleStage: { in: ["planning", "live"] } }, eWhere] },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    prisma.attendance.findMany({ where: { clockOut: null }, include: { profile: true }, take: 8 }),
    Promise.all([
      prisma.task.count({ where: { AND: [{ status: { not: "done" } }, tWhere] } }),
      prisma.task.count({ where: { AND: [{ status: { not: "done" }, dueDate: { lt: now } }, tWhere] } }),
      prisma.event.count({ where: { AND: [{ lifecycleStage: { notIn: ["closed"] } }, eWhere] } }),
      prisma.profile.count({ where: { status: "active" } }),
    ]),
  ]);

  const [openTasks, overdue, activeEvents, teamSize] = counts;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome back, {user.fullName.split(" ")[0]} 👋</h2>
        <p className="text-sm text-[var(--text-muted)]">Here&apos;s what needs your attention today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Open tasks" value={openTasks} hint={seesAll ? "across all departments" : "your work"} accent="var(--brand-2)" />
        <Stat label="Overdue" value={overdue} hint="need attention" accent={overdue > 0 ? "var(--danger)" : undefined} />
        <Stat label="Active events" value={activeEvents} hint="in the pipeline" accent="var(--brand)" />
        <Stat label="Team" value={teamSize} hint="active members" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="My tasks"
            subtitle="Assigned to you, not yet done"
            action={
              <Link href="/tasks" className="flex items-center gap-1 text-sm text-[var(--brand-2)] hover:underline">
                All tasks <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="divide-y divide-[var(--border)]">
            {myTasks.length === 0 && <div className="p-5"><EmptyState title="No open tasks 🎉" hint="You're all caught up." /></div>}
            {myTasks.map((t) => {
              const isOverdue = t.dueDate && t.dueDate < now;
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <CheckSquare size={16} className="shrink-0 text-[var(--text-dim)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-[var(--text-dim)]">{t.event?.name ?? "General"}</p>
                  </div>
                  <Badge color={PRIORITY_COLOR[t.priority]}>{t.priority}</Badge>
                  <span className={`w-20 shrink-0 text-right text-xs ${isOverdue ? "text-[var(--danger)]" : "text-[var(--text-dim)]"}`}>
                    {t.dueDate ? relativeDay(t.dueDate) : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Working now" subtitle={`${workingNow.length} online`} />
          <div className="space-y-1 p-3">
            {workingNow.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-[var(--text-dim)]">No one clocked in yet.</p>
            )}
            {workingNow.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                <div className="relative">
                  <Avatar name={a.profile.fullName} color={a.profile.avatarColor} size={32} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--bg-card)] bg-[var(--success)]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.profile.fullName}</p>
                  <p className="truncate text-xs text-[var(--text-dim)]">{a.profile.jobRole}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My KPIs */}
        <Card>
          <CardHeader title="My KPIs" subtitle="Targets assigned to you across events" />
          <div className="p-3">
            {myKpis.length === 0 && <EmptyState title="No KPIs assigned" hint="Event owners assign KPIs to you." />}
            {myKpis.map((k) => (
              <div key={k.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                <Target size={16} className={k.status === "done" ? "text-[var(--success)]" : "text-[var(--text-dim)]"} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm ${k.status === "done" ? "text-[var(--text-dim)] line-through" : ""}`}>{k.title}</p>
                  <p className="truncate text-xs text-[var(--text-dim)]">{k.event.name}</p>
                </div>
                {k.target && <Badge color="var(--brand-2)">{k.target}</Badge>}
              </div>
            ))}
          </div>
        </Card>

        {/* Events in motion */}
        <Card>
          <CardHeader
            title="Events in motion"
            action={
              <Link href="/events" className="flex items-center gap-1 text-sm text-[var(--brand-2)] hover:underline">
                All <ArrowRight size={14} />
              </Link>
            }
          />
          <div className="divide-y divide-[var(--border)]">
            {liveEvents.length === 0 && <div className="p-5"><EmptyState title="No active events" /></div>}
            {liveEvents.map((e) => (
              <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-hover)]">
                <CalendarDays size={16} className="text-[var(--text-dim)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-[var(--text-dim)]">{e.gameTitle}</p>
                </div>
                <Badge color={EVENT_STAGE_COLOR[e.lifecycleStage]}>
                  <Dot color={EVENT_STAGE_COLOR[e.lifecycleStage]} />
                  {EVENT_STAGE_LABEL[e.lifecycleStage]}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
