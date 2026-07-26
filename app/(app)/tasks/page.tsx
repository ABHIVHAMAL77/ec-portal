import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskWhere, eventWhere, canSeeAll, isManagerLevel } from "@/lib/access";
import { TaskBoard, type BoardTask } from "@/components/task-board";
import { NewTaskButton } from "@/components/new-task";

export default async function TasksPage() {
  const user = await requireUser();
  const canAssign = isManagerLevel(user); // only heads / execs create & assign
  const seesAll = canSeeAll(user);

  const [tasks, departments, people, events] = await Promise.all([
    prisma.task.findMany({
      where: taskWhere(user),
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { fullName: true, avatarColor: true } },
        department: { select: { name: true, color: true } },
        event: { select: { name: true } },
      },
    }),
    // Heads assign within their department; execs across all departments.
    prisma.department.findMany({
      where: seesAll ? {} : { id: user.departmentId ?? undefined },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.profile.findMany({
      where: seesAll ? {} : { departmentId: user.departmentId ?? undefined },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    }),
    prisma.event.findMany({
      where: { AND: [{ lifecycleStage: { notIn: ["closed"] } }, eventWhere(user)] },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ]);

  const boardTasks: BoardTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    assignee: t.assignee,
    department: t.department,
    event: t.event,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Task Board</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {seesAll
              ? `${tasks.length} tasks · move cards across columns to update status.`
              : `${tasks.length} tasks assigned to you · drag across columns to update.`}
          </p>
        </div>
        {canAssign && (
          <NewTaskButton
            departments={departments.map((d) => ({ id: d.id, label: d.name }))}
            people={people.map((p) => ({ id: p.id, label: p.fullName }))}
            events={events.map((e) => ({ id: e.id, label: e.name }))}
          />
        )}
      </div>

      <TaskBoard tasks={boardTasks} />
    </div>
  );
}
