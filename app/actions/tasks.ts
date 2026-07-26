"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canSeeAll, isManagerLevel } from "@/lib/access";
import { notify } from "@/lib/notify";

export async function updateTaskStatus(taskId: string, status: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found." };

  // May act only on tasks in this user's scope.
  const allowed =
    canSeeAll(user) ||
    task.assigneeId === user.id ||
    task.createdById === user.id ||
    (isManagerLevel(user) && task.departmentId && task.departmentId === user.departmentId);
  if (!allowed) return { error: "You can't change this task." };

  await prisma.task.update({
    where: { id: taskId },
    data: { status, completedAt: status === "done" ? new Date() : null },
  });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function createTask(formData: FormData) {
  const user = await requireUser();
  if (!isManagerLevel(user)) return { error: "Only department heads can assign tasks." };
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Task title is required." };

  const departmentId = String(formData.get("departmentId") ?? "") || null;
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  const eventId = String(formData.get("eventId") ?? "") || null;
  const priority = String(formData.get("priority") ?? "medium");
  const dueRaw = String(formData.get("dueDate") ?? "");
  const dueDate = dueRaw ? new Date(dueRaw) : null;

  const task = await prisma.task.create({
    data: {
      title,
      priority,
      dueDate,
      departmentId,
      assigneeId,
      eventId,
      createdById: user.id,
      status: "todo",
    },
  });

  // Notify the assignee.
  if (assigneeId && assigneeId !== user.id) {
    await notify({
      recipientId: assigneeId,
      type: "task_assigned",
      message: `${user.fullName} assigned you a task: "${title}"`,
      link: `/tasks/${task.id}`,
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { ok: true, id: task.id };
}
