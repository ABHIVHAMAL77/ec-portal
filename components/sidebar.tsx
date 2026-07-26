"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Users,
  Clock,
  Wallet,
  BarChart3,
  Bell,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  need?: "approver" | "manager" | "finance";
};

const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/payments", label: "Payments", icon: Banknote, need: "finance" },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/people", label: "Team", icon: Users },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/finance", label: "Finance & Requests", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3, need: "manager" },
];

export function Sidebar({
  isManager,
  isFinance,
}: {
  isApprover: boolean;
  isManager: boolean;
  isFinance: boolean;
}) {
  const pathname = usePathname();
  const items = nav.filter((n) =>
    n.need === "manager" ? isManager : n.need === "finance" ? isFinance : true
  );
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-elev)] md:flex">
      <div className="flex h-16 items-center border-b border-[var(--border)] px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--brand)]/15 text-[var(--text)] shadow-[inset_0_0_0_1px_var(--brand)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
              )}
            >
              <Icon size={18} className={active ? "text-[var(--brand-2)]" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--border)] p-4 text-[10px] uppercase tracking-widest text-[var(--text-dim)]">
        Esports County · v0.1
      </div>
    </aside>
  );
}
