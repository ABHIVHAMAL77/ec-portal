"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Megaphone } from "lucide-react";
import { markRead, markAllRead, postAnnouncement } from "@/app/actions/notifications";
import { timeAgo } from "@/lib/utils";
import { Button } from "./ui";

export type Notif = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={disabled || pending}
      onClick={() => start(() => void markAllRead())}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] disabled:opacity-50"
    >
      <CheckCheck size={15} /> Mark all read
    </button>
  );
}

export function NotificationItem({ n }: { n: Notif }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const unread = !n.readAt;

  function open() {
    start(async () => {
      if (unread) await markRead(n.id);
      if (n.link) router.push(n.link);
    });
  }

  return (
    <button
      onClick={open}
      disabled={pending}
      className={`flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--bg-hover)] ${
        unread ? "bg-[var(--brand)]/5" : ""
      }`}
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
          unread ? "bg-[var(--brand)]" : "bg-transparent"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${unread ? "font-medium" : "text-[var(--text-muted)]"}`}>{n.message}</p>
        <p className="mt-0.5 text-xs text-[var(--text-dim)]">{timeAgo(n.createdAt)}</p>
      </div>
    </button>
  );
}

export function AnnounceComposer() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <form
      action={(fd) =>
        start(async () => {
          setError(null);
          const res = await postAnnouncement(fd);
          if (res?.error) setError(res.error);
          else {
            setSent(true);
            setTimeout(() => setSent(false), 2500);
            (document.getElementById("announce-form") as HTMLFormElement)?.reset();
          }
        })
      }
      id="announce-form"
      className="space-y-2"
    >
      <textarea
        name="message"
        rows={2}
        placeholder="Post an announcement everyone will see…"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
      />
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {sent && <p className="text-sm text-[var(--success)]">📢 Sent to everyone.</p>}
      <Button type="submit" disabled={pending}>
        <Megaphone size={16} /> {pending ? "Sending…" : "Announce to all"}
      </Button>
    </form>
  );
}
