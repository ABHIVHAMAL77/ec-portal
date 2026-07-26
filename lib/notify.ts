import { prisma } from "./db";
import { sendEmail, emailHtml } from "./email";

const SUBJECTS: Record<string, string> = {
  task_assigned: "New task assigned",
  kpi: "New KPI assigned to you",
  comment: "New comment",
  manpower: "Manpower request update",
  emergency: "🚨 Emergency",
  escalation: "New issue raised",
  approval: "Approval needed",
  announcement: "📢 Team announcement",
  payment: "💰 Payment submission",
};

// Create an in-app notification AND email the recipient (if email is configured).
export async function notify(opts: {
  recipientId: string;
  type: string;
  message: string;
  link?: string | null;
}) {
  await prisma.notification.create({
    data: {
      recipientId: opts.recipientId,
      type: opts.type,
      message: opts.message,
      link: opts.link ?? null,
    },
  });

  const profile = await prisma.profile.findUnique({
    where: { id: opts.recipientId },
    select: { email: true },
  });
  if (profile?.email) {
    await sendEmail({
      to: profile.email,
      subject: SUBJECTS[opts.type] ?? "Esports County Portal",
      html: emailHtml(opts.message, opts.link),
    });
  }
}

// Same, for many recipients (e.g. announcements).
export async function notifyMany(
  recipientIds: string[],
  opts: { type: string; message: string; link?: string | null }
) {
  if (recipientIds.length === 0) return;
  await prisma.notification.createMany({
    data: recipientIds.map((recipientId) => ({
      recipientId,
      type: opts.type,
      message: opts.message,
      link: opts.link ?? null,
    })),
  });

  const people = await prisma.profile.findMany({
    where: { id: { in: recipientIds } },
    select: { email: true },
  });
  await Promise.all(
    people
      .filter((p) => p.email)
      .map((p) =>
        sendEmail({
          to: p.email,
          subject: SUBJECTS[opts.type] ?? "Esports County Portal",
          html: emailHtml(opts.message, opts.link),
        })
      )
  );
}
