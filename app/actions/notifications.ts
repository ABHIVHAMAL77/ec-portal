"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canSeeAll } from "@/lib/access";
import { notifyMany } from "@/lib/notify";

export async function markRead(id: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { id, recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
  return { ok: true };
}

export async function markAllRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { recipientId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
  return { ok: true };
}

// Company-wide announcement — a notification delivered to everyone.
export async function postAnnouncement(formData: FormData) {
  const user = await requireUser();
  if (!canSeeAll(user)) return { error: "Only the Founder or COO can post announcements." };
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Write an announcement." };

  const everyone = await prisma.profile.findMany({
    where: { status: "active" },
    select: { id: true },
  });

  await notifyMany(
    everyone.map((p) => p.id),
    { type: "announcement", message: `📢 ${message}`, link: "/notifications" }
  );

  revalidatePath("/notifications");
  return { ok: true };
}
