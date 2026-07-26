"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

export function NotificationBell({ unread }: { unread: number }) {
  return (
    <Link
      href="/notifications"
      title="Notifications"
      className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
