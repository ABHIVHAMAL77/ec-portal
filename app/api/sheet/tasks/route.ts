import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notify";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";

// Bulk task management from a Google Sheet.
//   GET  -> every task as flat rows (portal -> sheet)
//   POST -> create/update tasks from sheet rows (sheet -> portal)
// Both are protected by SHEET_SYNC_SECRET.

export const TASK_COLUMNS = [
  "taskId",
  "title",
  "assigneeEmail",
  "department",
  "event",
  "priority",
  "status",
  "dueDate",
  "description",
] as const;

function ymd(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

function authorised(given: string | null): boolean {
  const secret = process.env.SHEET_SYNC_SECRET;
  return Boolean(secret) && given === secret;
}

export async function GET(req: Request) {
  if (!authorised(new URL(req.url).searchParams.get("secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await prisma.task.findMany({
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: {
      assignee: { select: { email: true } },
      department: { select: { name: true } },
      event: { select: { name: true } },
    },
  });

  return NextResponse.json({
    columns: TASK_COLUMNS,
    rows: tasks.map((t) => ({
      taskId: t.id,
      title: t.title,
      assigneeEmail: t.assignee?.email ?? "",
      department: t.department?.name ?? "",
      event: t.event?.name ?? "",
      priority: t.priority,
      status: t.status,
      dueDate: ymd(t.dueDate),
      description: t.description ?? "",
    })),
  });
}

type IncomingRow = {
  taskId?: string;
  title?: string;
  assigneeEmail?: string;
  department?: string;
  event?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  description?: string;
};

export async function POST(req: Request) {
  let body: { secret?: string; rows?: IncomingRow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!authorised(body.secret ?? null)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (rows.length === 0) return NextResponse.json({ ok: true, created: 0, updated: 0, results: [] });

  // Look names up once, then match in memory (SQLite has no case-insensitive filter).
  const [people, departments, events, admin] = await Promise.all([
    prisma.profile.findMany({ select: { id: true, email: true, fullName: true } }),
    prisma.department.findMany({ select: { id: true, name: true } }),
    prisma.event.findMany({ select: { id: true, name: true } }),
    prisma.profile.findFirst({ where: { accessLevel: "admin" }, select: { id: true } }),
  ]);

  const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();
  const findPerson = (v: string | undefined) =>
    people.find((p) => p.email.toLowerCase() === norm(v)) ??
    people.find((p) => p.fullName.toLowerCase() === norm(v));
  const findDept = (v: string | undefined) => departments.find((d) => d.name.toLowerCase() === norm(v));
  const findEvent = (v: string | undefined) => events.find((e) => e.name.toLowerCase() === norm(v));

  const results: { row: number; taskId?: string; action: string; error?: string }[] = [];
  let created = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNo = i + 2; // sheet row (1 = header)
    const title = (r.title ?? "").trim();

    if (!title && !(r.taskId ?? "").trim()) continue; // blank line

    if (!title) {
      results.push({ row: rowNo, action: "skipped", error: "Title is required" });
      continue;
    }

    // Validate the controlled values, but don't fail the whole batch on a typo.
    const priority = norm(r.priority) || "medium";
    if (!TASK_PRIORITIES.includes(priority as (typeof TASK_PRIORITIES)[number])) {
      results.push({ row: rowNo, action: "skipped", error: `priority must be one of: ${TASK_PRIORITIES.join(", ")}` });
      continue;
    }
    const status = (norm(r.status) || "todo").replace(/\s+/g, "_");
    if (!TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) {
      results.push({ row: rowNo, action: "skipped", error: `status must be one of: ${TASK_STATUSES.join(", ")}` });
      continue;
    }

    if (r.assigneeEmail && !findPerson(r.assigneeEmail)) {
      results.push({ row: rowNo, action: "skipped", error: `no team member matches "${r.assigneeEmail}"` });
      continue;
    }
    if (r.department && !findDept(r.department)) {
      results.push({ row: rowNo, action: "skipped", error: `no department named "${r.department}"` });
      continue;
    }
    if (r.event && !findEvent(r.event)) {
      results.push({ row: rowNo, action: "skipped", error: `no event named "${r.event}"` });
      continue;
    }

    let dueDate: Date | null = null;
    if ((r.dueDate ?? "").trim()) {
      const d = new Date(r.dueDate as string);
      if (Number.isNaN(d.getTime())) {
        results.push({ row: rowNo, action: "skipped", error: "dueDate should look like 2026-08-15" });
        continue;
      }
      dueDate = d;
    }

    const data = {
      title,
      description: (r.description ?? "").trim() || null,
      priority,
      status,
      dueDate,
      assigneeId: r.assigneeEmail ? findPerson(r.assigneeEmail)!.id : null,
      departmentId: r.department ? findDept(r.department)!.id : null,
      eventId: r.event ? findEvent(r.event)!.id : null,
      completedAt: status === "done" ? new Date() : null,
    };

    const existingId = (r.taskId ?? "").trim();
    if (existingId) {
      const found = await prisma.task.findUnique({ where: { id: existingId } });
      if (!found) {
        results.push({ row: rowNo, action: "skipped", error: "taskId not found" });
        continue;
      }
      await prisma.task.update({ where: { id: existingId }, data });
      updated++;
      results.push({ row: rowNo, taskId: existingId, action: "updated" });

      // Tell someone newly put on an existing task.
      if (data.assigneeId && data.assigneeId !== found.assigneeId) {
        await notify({
          recipientId: data.assigneeId,
          type: "task_assigned",
          message: `You've been assigned a task: "${title}"`,
          link: `/tasks/${existingId}`,
        });
      }
    } else {
      const task = await prisma.task.create({
        data: { ...data, createdById: admin?.id ?? null },
      });
      created++;
      results.push({ row: rowNo, taskId: task.id, action: "created" });

      if (data.assigneeId) {
        await notify({
          recipientId: data.assigneeId,
          type: "task_assigned",
          message: `You've been assigned a task: "${title}"`,
          link: `/tasks/${task.id}`,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, created, updated, results });
}
