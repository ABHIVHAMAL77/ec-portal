"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

// Emergency → alerts the Operations Manager immediately (workflow §10).
export async function raiseEscalation(type: "emergency" | "non_emergency", message: string) {
  const user = await requireUser();
  if (!message.trim()) return { error: "Please describe the issue." };

  await prisma.escalation.create({
    data: { raisedById: user.id, type, message: message.trim() },
  });

  // Notify the Operations Manager (head of the Operations department),
  // falling back to an admin if no head is set yet.
  const opsDept = await prisma.department.findFirst({ where: { slug: "operations" } });
  const opsManager =
    (opsDept?.headId
      ? await prisma.profile.findUnique({ where: { id: opsDept.headId } })
      : null) ?? (await prisma.profile.findFirst({ where: { accessLevel: "admin" } }));
  if (opsManager) {
    await notify({
      recipientId: opsManager.id,
      type: type === "emergency" ? "emergency" : "escalation",
      message:
        (type === "emergency" ? "🚨 EMERGENCY from " : "Issue raised by ") +
        user.fullName +
        ": " +
        message.trim(),
      link: "/notifications",
    });
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
