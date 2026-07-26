import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EVENT_STAGE_LABEL, EVENT_STAGE_COLOR, EVENT_STAGES } from "@/lib/constants";
import { Card, Badge, Dot, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { eventWhere, canSeeAll } from "@/lib/access";
import { NewEventButton } from "./new-event";
import { CalendarDays } from "lucide-react";

export default async function EventsPage() {
  const user = await requireUser();

  const events = await prisma.event.findMany({
    where: eventWhere(user),
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tasks: true, crew: true, kpis: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Events &amp; Tournaments</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {canSeeAll(user)
              ? `Every project from pitch to wrap. ${events.length} total.`
              : `Events you're involved in. ${events.length} total.`}
          </p>
        </div>
        {canSeeAll(user) && <NewEventButton />}
      </div>

      {/* Pipeline legend */}
      <div className="flex flex-wrap gap-2">
        {EVENT_STAGES.map((s) => (
          <Badge key={s} color={EVENT_STAGE_COLOR[s]}>
            <Dot color={EVENT_STAGE_COLOR[s]} />
            {EVENT_STAGE_LABEL[s]}
          </Badge>
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState title="No events yet" hint="Pitch your first event to get started." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            return (
              <Link key={e.id} href={`/events/${e.id}`}>
                <Card className="h-full p-5 transition-colors hover:border-[var(--brand)] hover:bg-[var(--bg-hover)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-elev)]">
                      <CalendarDays size={20} className="text-[var(--brand-2)]" />
                    </div>
                    <Badge color={EVENT_STAGE_COLOR[e.lifecycleStage]}>
                      <Dot color={EVENT_STAGE_COLOR[e.lifecycleStage]} />
                      {EVENT_STAGE_LABEL[e.lifecycleStage]}
                    </Badge>
                  </div>
                  <h3 className="mt-3 font-semibold">{e.name}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{e.gameTitle ?? e.type}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-dim)]">
                    <span>{e._count.tasks} tasks</span>
                    <span>{e._count.crew} crew</span>
                    <span>{e._count.kpis} KPIs</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-dim)]">
                    {e.startDate ? `Starts ${formatDate(e.startDate)}` : "No date set"}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
