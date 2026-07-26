"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, CheckSquare, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/attendance", label: "Hours", icon: Clock },
  { href: "/people", label: "Team", icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-[var(--border)] bg-[var(--bg-elev)] md:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[10px]",
              active ? "text-[var(--brand-2)]" : "text-[var(--text-dim)]"
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
