"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser, hashPassword, verifyPassword } from "@/lib/auth";

export async function createEmployee(formData: FormData) {
  const user = await requireUser();
  if (user.accessLevel !== "admin") return { error: "Only an admin can add employees." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const jobRole = String(formData.get("jobRole") ?? "").trim();
  const departmentId = String(formData.get("departmentId") ?? "") || null;
  const accessLevel = String(formData.get("accessLevel") ?? "member");
  const employmentType = String(formData.get("employmentType") ?? "full_time");
  const reportsToId = String(formData.get("reportsToId") ?? "") || null;
  const password = String(formData.get("password") ?? "").trim() || "esports123";
  const fullAccess = formData.get("fullAccess") === "on";
  const isDeptHead = formData.get("isDeptHead") === "on";

  if (!fullName || !email) return { error: "Name and email are required." };

  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) return { error: "That email is already registered." };

  const dept = departmentId
    ? await prisma.department.findUnique({ where: { id: departmentId } })
    : null;

  const person = await prisma.profile.create({
    data: {
      fullName,
      email,
      jobRole: jobRole || "Team Member",
      accessLevel,
      fullAccess,
      employmentType,
      departmentId,
      reportsToId,
      passwordHash: hashPassword(password),
      avatarColor: dept?.color ?? "#d6a43e",
    },
  });

  // Optionally make this person the head of their department.
  if (isDeptHead && departmentId) {
    await prisma.department.update({ where: { id: departmentId }, data: { headId: person.id } });
  }

  revalidatePath("/people");
  return { ok: true };
}

export async function updateEmployee(id: string, formData: FormData) {
  const user = await requireUser();
  if (user.accessLevel !== "admin") return { error: "Only an admin can edit employees." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!fullName || !email) return { error: "Name and email are required." };

  // Email must stay unique.
  const clash = await prisma.profile.findFirst({ where: { email, id: { not: id } } });
  if (clash) return { error: "That email is used by someone else." };

  const departmentId = String(formData.get("departmentId") ?? "") || null;
  const newPassword = String(formData.get("password") ?? "").trim();
  const isDeptHead = formData.get("isDeptHead") === "on";

  await prisma.profile.update({
    where: { id },
    data: {
      fullName,
      email,
      jobRole: String(formData.get("jobRole") ?? "").trim() || "Team Member",
      accessLevel: String(formData.get("accessLevel") ?? "member"),
      employmentType: String(formData.get("employmentType") ?? "full_time"),
      reportsToId: String(formData.get("reportsToId") ?? "") || null,
      fullAccess: formData.get("fullAccess") === "on",
      departmentId,
      ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
    },
  });

  if (isDeptHead && departmentId) {
    await prisma.department.update({ where: { id: departmentId }, data: { headId: id } });
  }

  revalidatePath("/people");
  return { ok: true };
}

export async function setEmployeeStatus(id: string, status: "active" | "inactive") {
  const user = await requireUser();
  if (user.accessLevel !== "admin") return { error: "Only an admin can do that." };
  if (id === user.id) return { error: "You can't deactivate your own account." };
  await prisma.profile.update({ where: { id }, data: { status } });
  revalidatePath("/people");
  return { ok: true };
}

// Any signed-in user changes their own password.
export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const user = await requireUser();
  if (newPassword.length < 6) return { error: "New password must be at least 6 characters." };
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (!profile || !verifyPassword(currentPassword, profile.passwordHash)) {
    return { error: "Your current password is incorrect." };
  }
  await prisma.profile.update({ where: { id: user.id }, data: { passwordHash: hashPassword(newPassword) } });
  return { ok: true };
}
