"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export async function createManpowerRequest(formData: FormData) {
  const user = await requireUser();
  const roleNeeded = String(formData.get("roleNeeded") ?? "").trim();
  if (!roleNeeded) return { error: "Role is required." };

  await prisma.manpowerRequest.create({
    data: {
      requestedById: user.id,
      departmentId: user.departmentId,
      roleNeeded,
      count: Math.max(1, Number(formData.get("count") ?? 1)),
      reason: String(formData.get("reason") ?? "") || null,
      budgetNote: String(formData.get("budgetNote") ?? "") || null,
    },
  });

  // Route to the Finance Manager (head of the Finance department), not the Founder.
  const financeDept = await prisma.department.findFirst({ where: { slug: "finance" } });
  const finance =
    (financeDept?.headId
      ? await prisma.profile.findUnique({ where: { id: financeDept.headId } })
      : null) ?? (await prisma.profile.findFirst({ where: { accessLevel: "admin" } }));
  if (finance) {
    await notify({
      recipientId: finance.id,
      type: "manpower",
      message: `${user.fullName} requested ${roleNeeded} — needs your approval.`,
      link: "/finance",
    });
  }

  revalidatePath("/finance");
  return { ok: true };
}

export async function decideManpower(id: string, decision: "approved" | "rejected") {
  const user = await requireUser();
  const financeDept = await prisma.department.findFirst({ where: { slug: "finance" } });
  const isFinance =
    user.accessLevel === "admin" || user.fullAccess === true || financeDept?.headId === user.id;
  if (!isFinance) return { error: "Only the Finance Manager can decide manpower requests." };

  const req = await prisma.manpowerRequest.update({
    where: { id },
    data: { status: decision, decidedById: user.id },
  });

  await notify({
    recipientId: req.requestedById,
    type: "manpower",
    message: `Your manpower request (${req.roleNeeded}) was ${decision}.`,
    link: "/finance",
  });

  revalidatePath("/finance");
  return { ok: true };
}
