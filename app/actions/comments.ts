"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function addTaskComment(taskId: string, body: string) {
  const user = await requireUser();
  const text = body.trim();
  if (!text) return { error: "Message is empty." };

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found." };

  await prisma.taskComment.create({ data: { taskId, authorId: user.id, body: text } });

  // Notify the other people on the task (assignee + creator), not the author.
  const targets = new Set<string>();
  if (task.assigneeId && task.assigneeId !== user.id) targets.add(task.assigneeId);
  if (task.createdById && task.createdById !== user.id) targets.add(task.createdById);
  for (const recipientId of targets) {
    await notify({
      recipientId,
      type: "comment",
      message: `${user.fullName} commented on "${task.title}"`,
      link: `/tasks/${taskId}`,
    });
  }

  revalidatePath(`/tasks/${taskId}`);
  return { ok: true };
}

export async function addEventComment(eventId: string, body: string) {
  const user = await requireUser();
  const text = body.trim();
  if (!text) return { error: "Message is empty." };

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { error: "Event not found." };

  await prisma.eventComment.create({ data: { eventId, authorId: user.id, body: text } });

  // Notify the event crew (except the author).
  const crew = await prisma.eventCrew.findMany({ where: { eventId } });
  const targets = new Set(crew.map((c) => c.profileId).filter((id) => id !== user.id));
  if (event.createdById && event.createdById !== user.id) targets.add(event.createdById);
  for (const recipientId of targets) {
    await notify({
      recipientId,
      type: "comment",
      message: `${user.fullName} posted in "${event.name}" discussion`,
      link: `/events/${eventId}`,
    });
  }

  revalidatePath(`/events/${eventId}`);
  return { ok: true };
}
