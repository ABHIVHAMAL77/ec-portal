"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canSeeAll } from "@/lib/access";

// Manager/admin moves the event along its lifecycle.
export async function advanceStage(eventId: string, stage: string) {
  const user = await requireUser();
  if (user.accessLevel === "member") return { error: "Only managers can change the stage." };
  await prisma.event.update({ where: { id: eventId }, data: { lifecycleStage: stage } });
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  return { ok: true };
}

// Founder or COO create an event directly (no pitch/approval step).
export async function createEvent(formData: FormData) {
  const user = await requireUser();
  if (!canSeeAll(user)) return { error: "Only the Founder or COO can create events." };
  const name = String(formData.get("name") ?? "").trim();
  const gameTitle = String(formData.get("gameTitle") ?? "").trim() || null;
  const type = String(formData.get("type") ?? "tournament");
  if (!name) return { error: "Event name is required." };

  const event = await prisma.event.create({
    data: { name, gameTitle, type, lifecycleStage: "planning", createdById: user.id },
  });

  revalidatePath("/events");
  redirect(`/events/${event.id}`);
}
