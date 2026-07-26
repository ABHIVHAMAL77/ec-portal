import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Card, CardHeader, Stat, Avatar } from "@/components/ui";
import { CsvExport } from "@/components/csv-export";
import { canSeeAll, taskWhere } from "@/lib/access";

export default async function ReportsPage() {
  const user = await requireUser();
  const seesAll = canSeeAll(user);
  // Execs see the whole company; department heads see their own department.
  const peopleWhere = seesAll
    ? { status: "active" }
    : { status: "active", departmentId: user.departmentId ?? undefined };

  const [departments, people, allTasks] = await Promise.all([
    prisma.department.findMany({
      where: seesAll ? {} : { id: user.departmentId ?? undefined },
      orderBy: { name: "asc" },
    }),
    prisma.profile.findMany({
      where: peopleWhere,
      include: {
        tasksAssigned: true,
        attendances: true,
      },
    }),
    prisma.task.findMany({ where: taskWhere(user) }),
  ]);

  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const onTime = allTasks.filter(
    (t) => t.status === "done" && t.completedAt && t.dueDate && t.completedAt <= t.dueDate
  ).length;
  const late = allTasks.filter(
    (t) => t.status === "done" && t.completedAt && t.dueDate && t.completedAt > t.dueDate
  ).length;

  // Per-department task counts
  const deptStats = departments
    .map((d) => {
      const dt = allTasks.filter((t) => t.departmentId === d.id);
      return {
        name: d.name,
        color: d.color,
        total: dt.length,
        done: dt.filter((t) => t.status === "done").length,
      };
    })
    .filter((d) => d.total > 0);
  const maxDept = Math.max(1, ...deptStats.map((d) => d.total));

  // Per-person leaderboard
  const rows = people
    .map((p) => {
      const total = p.tasksAssigned.length;
      const done = p.tasksAssigned.filter((t) => t.status === "done").length;
      const hours = p.attendances.reduce(
        (s, a) => s + Math.max(0, ((a.clockOut ?? new Date()).getTime() - a.clockIn.getTime()) / 3600000),
        0
      );
      return {
        name: p.fullName,
        role: p.jobRole,
        color: p.avatarColor,
        total,
        done,
        hours: Number(hours.toFixed(1)),
      };
    })
    .sort((a, b) => b.done - a.done);

  const csvRows = rows.map((r) => [r.name, r.role, r.total, r.done, r.hours]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reports</h2>
          <p className="text-sm text-[var(--text-muted)]">Team performance across tasks, goals and hours.</p>
        </div>
        <CsvExport
          filename="esports-county-report.csv"
          headers={["Name", "Role", "Tasks", "Done", "Hours"]}
          rows={csvRows}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total tasks" value={totalTasks} />
        <Stat label="Completed" value={doneTasks} accent="var(--success)" />
        <Stat label="On time" value={onTime} accent="var(--brand-2)" />
        <Stat label="Late" value={late} accent={late > 0 ? "var(--danger)" : undefined} />
      </div>

      <Card>
        <CardHeader title="Tasks by department" />
        <div className="space-y-3 p-5">
          {deptStats.map((d) => (
            <div key={d.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium">{d.name}</span>
                <span className="text-[var(--text-dim)]">
                  {d.done}/{d.total} done
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--bg-elev)]">
                <div className="h-full rounded-full" style={{ width: `${(d.total / maxDept) * 100}%`, backgroundColor: d.color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Team leaderboard" subtitle="Ranked by tasks completed" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)] text-left text-xs text-[var(--text-dim)]">
              <tr>
                <th className="px-5 py-2.5">Member</th>
                <th className="px-3 py-2.5">Tasks</th>
                <th className="px-3 py-2.5">Done</th>
                <th className="px-3 py-2.5">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.name} color={r.color} size={28} />
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-xs text-[var(--text-dim)]">{r.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[var(--text-muted)]">{r.total}</td>
                  <td className="px-3 py-3 font-medium text-[var(--success)]">{r.done}</td>
                  <td className="px-3 py-3 text-[var(--text-muted)]">{r.hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
