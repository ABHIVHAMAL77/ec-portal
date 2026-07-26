import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EVENT_STAGE_LABEL, EVENT_STAGE_COLOR, PRIORITY_COLOR, TASK_STATUS_LABEL } from "@/lib/constants";
import { Card, CardHeader, Badge, Dot, Avatar, EmptyState } from "@/components/ui";
import { StageControl } from "@/components/stage-control";
import { KpiBoard } from "@/components/kpi-board";
import { NewTaskButton } from "@/components/new-task";
import { Discussion, type ChatMessage } from "@/components/discussion";
import { AttachmentsPanel, type Attachment } from "@/components/attachments-panel";
import { addEventComment } from "@/app/actions/comments";
import { addAttachment } from "@/app/actions/attachments";
import { eventWhere, canSeeAll } from "@/lib/access";
import { formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const owner = canSeeAll(user); // Founder / COO own event setup

  const [event, people, departments] = await Promise.all([
    prisma.event.findFirst({
      where: { AND: [{ id }, eventWhere(user)] },
      include: {
        kpis: { include: { assignee: { select: { fullName: true, avatarColor: true } } }, orderBy: { createdAt: "asc" } },
        crew: { include: { profile: true } },
        tasks: { include: { assignee: true, department: true }, orderBy: { dueDate: "asc" } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, fullName: true, avatarColor: true } } },
        },
        attachments: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.profile.findMany({ where: { status: "active" }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!event) notFound();

  const canEdit = user.accessLevel !== "member";
  const peopleOpts = people.map((p) => ({ id: p.id, label: p.fullName }));

  const messages: ChatMessage[] = event.comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    author: c.author,
  }));
  const files: Attachment[] = event.attachments.map((a) => ({
    id: a.id,
    title: a.title,
    url: a.url,
    kind: a.kind,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft size={15} /> All events
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{event.name}</h2>
            <Badge color={EVENT_STAGE_COLOR[event.lifecycleStage]}>
              <Dot color={EVENT_STAGE_COLOR[event.lifecycleStage]} />
              {EVENT_STAGE_LABEL[event.lifecycleStage]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {event.gameTitle ?? "—"} · {event.type} · {event.startDate ? formatDate(event.startDate) : "no date"}
          </p>
        </div>
      </div>

      {/* Lifecycle */}
      <Card className="p-5">
        <p className="mb-3 text-sm font-medium text-[var(--text-muted)]">Lifecycle stage</p>
        <StageControl eventId={event.id} current={event.lifecycleStage} canEdit={canEdit} />
        {!canEdit && <p className="mt-2 text-xs text-[var(--text-dim)]">Only managers can change the stage.</p>}
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* KPIs */}
        <Card className="lg:col-span-2">
          <CardHeader title="KPIs" subtitle="Targets for this event, owned by the team" />
          <div className="p-5">
            <KpiBoard eventId={event.id} kpis={event.kpis} people={peopleOpts} canEdit={owner} currentUserId={user.id} />
          </div>
        </Card>

        {/* Crew */}
        <Card>
          <CardHeader title="Crew" subtitle={`${event.crew.length} assigned`} />
          <div className="space-y-1 p-3">
            {event.crew.length === 0 && <EmptyState title="No crew yet" />}
            {event.crew.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                <Avatar name={c.profile.fullName} color={c.profile.avatarColor} size={30} />
                <div className="min-w-0">
                  <p className="truncate text-sm">{c.profile.fullName}</p>
                  <p className="truncate text-xs capitalize text-[var(--text-dim)]">{c.crewRole}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* To-do list */}
      <Card>
        <CardHeader
          title="To-do list"
          subtitle={`${event.tasks.length} tasks`}
          action={
            owner ? (
              <NewTaskButton
                departments={departments.map((d) => ({ id: d.id, label: d.name }))}
                people={peopleOpts}
                events={[]}
                lockedEvent={{ id: event.id, name: event.name }}
                label="Add to-do"
              />
            ) : (
              <Link href="/tasks" className="text-sm text-[var(--brand-2)] hover:underline">
                Task board →
              </Link>
            )
          }
        />
        <div className="divide-y divide-[var(--border)]">
          {event.tasks.length === 0 && <div className="p-5"><EmptyState title="No tasks yet" hint={owner ? "Add to-dos and assign them." : undefined} /></div>}
          {event.tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/tasks/${t.id}`} className="truncate block text-sm font-medium hover:text-[var(--brand-2)]">
                  {t.title}
                </Link>
                <p className="text-xs text-[var(--text-dim)]">
                  {t.department?.name ?? "General"} · {TASK_STATUS_LABEL[t.status]}
                </p>
              </div>
              {t.assignee && <Avatar name={t.assignee.fullName} color={t.assignee.avatarColor} size={26} />}
              <Badge color={PRIORITY_COLOR[t.priority]}>{t.priority}</Badge>
              <span className="hidden w-24 text-right text-xs text-[var(--text-dim)] sm:inline">
                {t.dueDate ? formatDate(t.dueDate) : "—"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Discussion + files */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Discussion" subtitle="Team chat for this event" />
          <div className="p-5">
            <Discussion
              messages={messages}
              currentUserId={user.id}
              postAction={addEventComment.bind(null, event.id)}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Files & links" subtitle="Sheets, decks, assets" />
          <div className="p-4">
            <AttachmentsPanel
              attachments={files}
              canEdit
              addAction={addAttachment.bind(null, { eventId: event.id })}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
