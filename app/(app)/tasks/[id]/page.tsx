import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { taskWhere } from "@/lib/access";
import { addTaskComment } from "@/app/actions/comments";
import { addAttachment } from "@/app/actions/attachments";
import { TASK_STATUS_LABEL, PRIORITY_COLOR } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Card, CardHeader, Badge, Avatar, Dot } from "@/components/ui";
import { Discussion, type ChatMessage } from "@/components/discussion";
import { AttachmentsPanel, type Attachment } from "@/components/attachments-panel";
import { ArrowLeft } from "lucide-react";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const task = await prisma.task.findFirst({
    where: { AND: [{ id }, taskWhere(user)] },
    include: {
      assignee: true,
      department: true,
      event: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, fullName: true, avatarColor: true } } },
      },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!task) notFound();

  const messages: ChatMessage[] = task.comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    author: c.author,
  }));
  const files: Attachment[] = task.attachments.map((a) => ({
    id: a.id,
    title: a.title,
    url: a.url,
    kind: a.kind,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft size={15} /> Task board
      </Link>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main: details + discussion */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold">{task.title}</h2>
              <Badge color={PRIORITY_COLOR[task.priority]}>{task.priority}</Badge>
            </div>
            {task.description && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-muted)]">{task.description}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Dot color="var(--brand-2)" /> {TASK_STATUS_LABEL[task.status]}
              </span>
              {task.department && (
                <span className="text-[var(--text-muted)]">{task.department.name}</span>
              )}
              {task.event && (
                <Link href={`/events/${task.event.id}`} className="text-[var(--brand-2)] hover:underline">
                  {task.event.name}
                </Link>
              )}
              <span className="text-[var(--text-dim)]">
                Due {task.dueDate ? formatDate(task.dueDate) : "—"}
              </span>
              {task.assignee && (
                <span className="flex items-center gap-1.5">
                  <Avatar name={task.assignee.fullName} color={task.assignee.avatarColor} size={22} />
                  <span className="text-[var(--text-muted)]">{task.assignee.fullName}</span>
                </span>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Discussion" subtitle="Talk through how to do it or raise issues" />
            <div className="p-5">
              <Discussion
                messages={messages}
                currentUserId={user.id}
                postAction={addTaskComment.bind(null, task.id)}
              />
            </div>
          </Card>
        </div>

        {/* Right: files & links */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="Files & links" subtitle="Sheets, decks, assets" />
            <div className="p-4">
              <AttachmentsPanel
                attachments={files}
                canEdit
                addAction={addAttachment.bind(null, { taskId: task.id })}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
