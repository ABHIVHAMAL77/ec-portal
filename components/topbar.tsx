"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { EMPLOYMENT_LABEL } from "@/lib/constants";
import { Avatar } from "./ui";
import { EmergencyButton } from "./emergency-button";
import { NotificationBell } from "./notification-bell";
import { LogOut } from "lucide-react";

type TopUser = {
  fullName: string;
  jobRole: string;
  employmentType: string;
  avatarColor: string;
  departmentName: string | null;
};

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/events": "Events & Tournaments",
  "/approvals": "Project Approvals",
  "/tasks": "Tasks",
  "/weekly": "Weekly Goals",
  "/run-of-show": "Broadcast Run of Show",
  "/people": "Team",
  "/attendance": "Attendance",
  "/finance": "Manpower & Finance",
  "/reports": "Reports",
};

function titleFor(pathname: string): string {
  const key = Object.keys(TITLES).find((k) => pathname === k || pathname.startsWith(k + "/"));
  return key ? TITLES[key] : "Esports County";
}

export function Topbar({ user, unread }: { user: TopUser; unread: number }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg)]/85 px-4 backdrop-blur md:px-6">
      <div>
        <h1 className="text-lg font-semibold leading-tight">{titleFor(pathname)}</h1>
        <p className="text-xs text-[var(--text-dim)]">
          {user.departmentName ?? "—"} · {user.jobRole}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell unread={unread} />
        <EmergencyButton />
        <Link href="/account" title="My account" className="hidden items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-[var(--bg-hover)] sm:flex">
          <Avatar name={user.fullName} color={user.avatarColor} size={34} />
          <div className="leading-tight">
            <div className="text-sm font-medium">{user.fullName}</div>
            <div className="text-[11px] text-[var(--text-dim)]">
              {EMPLOYMENT_LABEL[user.employmentType] ?? user.employmentType}
            </div>
          </div>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            title="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
