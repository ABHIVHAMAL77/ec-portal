import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canSeeAll } from "@/lib/access";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import {
  MarkAllReadButton,
  NotificationItem,
  AnnounceComposer,
  type Notif,
} from "@/components/notifications-ui";

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const items: Notif[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    link: n.link,
    readAt: n.readAt ? n.readAt.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up."}
          </p>
        </div>
        <MarkAllReadButton disabled={unreadCount === 0} />
      </div>

      {canSeeAll(user) && (
        <Card>
          <CardHeader title="Announcement" subtitle="Send a notice to the whole team" />
          <div className="p-5">
            <AnnounceComposer />
          </div>
        </Card>
      )}

      <Card>
        <div className="divide-y divide-[var(--border)]">
          {items.length === 0 && (
            <div className="p-5">
              <EmptyState title="No notifications yet" hint="Assignments, comments and announcements appear here." />
            </div>
          )}
          {items.map((n) => (
            <NotificationItem key={n.id} n={n} />
          ))}
        </div>
      </Card>
    </div>
  );
}
