"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { detectKind } from "@/lib/utils";

export async function addAttachment(
  target: { taskId?: string; eventId?: string },
  formData: FormData
) {
  const user = await requireUser();
  const url = String(formData.get("url") ?? "").trim();
  let title = String(formData.get("title") ?? "").trim();
  if (!url) return { error: "Paste a link." };
  if (!/^https?:\/\//i.test(url)) return { error: "Link must start with http:// or https://" };
  if (!title) {
    try {
      title = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      title = "Link";
    }
  }

  await prisma.attachment.create({
    data: {
      taskId: target.taskId ?? null,
      eventId: target.eventId ?? null,
      title,
      url,
      kind: detectKind(url),
      addedById: user.id,
    },
  });

  if (target.taskId) revalidatePath(`/tasks/${target.taskId}`);
  if (target.eventId) revalidatePath(`/events/${target.eventId}`);
  return { ok: true };
}

export async function deleteAttachment(id: string) {
  await requireUser();
  const att = await prisma.attachment.findUnique({ where: { id } });
  if (att) {
    await prisma.attachment.delete({ where: { id } });
    if (att.taskId) revalidatePath(`/tasks/${att.taskId}`);
    if (att.eventId) revalidatePath(`/events/${att.eventId}`);
  }
  return { ok: true };
}
