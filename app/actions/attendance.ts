"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function clockIn() {
  const user = await requireUser();
  const open = await prisma.attendance.findFirst({
    where: { profileId: user.id, clockOut: null },
  });
  if (!open) {
    await prisma.attendance.create({ data: { profileId: user.id } });
  }
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function clockOut(report?: string, links?: string) {
  const user = await requireUser();
  const open = await prisma.attendance.findFirst({
    where: { profileId: user.id, clockOut: null },
    orderBy: { clockIn: "desc" },
  });
  if (open) {
    await prisma.attendance.update({
      where: { id: open.id },
      data: {
        clockOut: new Date(),
        report: report?.trim() || null,
        links: links?.trim() || null,
      },
    });
  }
  revalidatePath("/attendance");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { ok: true };
}
