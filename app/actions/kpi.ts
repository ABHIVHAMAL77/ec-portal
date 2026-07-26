"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canSeeAll } from "@/lib/access";
import { notify } from "@/lib/notify";

export async function addKpi(formData: FormData) {
  const user = await requireUser();
  if (!canSeeAll(user)) return { error: "Only the Founder or COO can set KPIs." };

  const eventId = String(formData.get("eventId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!eventId || !title) return { error: "KPI title is required." };
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;

  await prisma.kpi.create({
    data: {
      eventId,
      title,
      target: String(formData.get("target") ?? "") || null,
      assigneeId,
    },
  });

  if (assigneeId && assigneeId !== user.id) {
    await notify({
      recipientId: assigneeId,
      type: "kpi",
      message: `${user.fullName} set you a KPI: "${title}"`,
      link: `/events/${eventId}`,
    });
  }

  revalidatePath(`/events/${eventId}`);
  return { ok: true };
}

export async function toggleKpi(id: string) {
  const user = await requireUser();
  const kpi = await prisma.kpi.findUnique({ where: { id } });
  if (!kpi) return { error: "Not found." };
  const allowed = canSeeAll(user) || kpi.assigneeId === user.id;
  if (!allowed) return { error: "You can't update this KPI." };

  await prisma.kpi.update({
    where: { id },
    data: { status: kpi.status === "done" ? "open" : "done" },
  });
  revalidatePath(`/events/${kpi.eventId}`);
  return { ok: true };
}

export async function deleteKpi(id: string) {
  const user = await requireUser();
  if (!canSeeAll(user)) return { error: "Not allowed." };
  const kpi = await prisma.kpi.findUnique({ where: { id } });
  if (kpi) await prisma.kpi.delete({ where: { id } });
  if (kpi) revalidatePath(`/events/${kpi.eventId}`);
  return { ok: true };
}
