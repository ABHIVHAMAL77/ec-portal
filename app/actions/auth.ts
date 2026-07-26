"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession, destroySession } from "@/lib/auth";

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const profile = await prisma.profile.findUnique({ where: { email } });
  if (!profile || !verifyPassword(password, profile.passwordHash)) {
    return { error: "Incorrect email or password." };
  }
  if (profile.status === "inactive") {
    return { error: "This account has been deactivated. Contact your admin." };
  }

  await createSession(profile.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
