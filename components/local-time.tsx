"use client";

import { useEffect, useState } from "react";

// Times are stored in UTC. Rendering them on the server would use the server's
// clock (the VPS runs UTC), so everyone would see the wrong time. These render
// after mount using the viewer's own timezone, whatever country they're in.

type Mode = "time" | "date" | "datetime" | "ago";

function format(iso: string, mode: Mode): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  if (mode === "ago") {
    const s = Math.round((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "just now";
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.round(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  }

  if (mode === "time") {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  if (mode === "date") {
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  }
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LocalTime({
  iso,
  mode = "datetime",
  className,
}: {
  iso: string | null | undefined;
  mode?: Mode;
  className?: string;
}) {
  // Render nothing meaningful on the server, then fill in on mount so the
  // string always matches the viewer's timezone.
  const [text, setText] = useState<string>("…");

  useEffect(() => {
    if (!iso) {
      setText("—");
      return;
    }
    setText(format(iso, mode));
    if (mode === "ago") {
      const t = setInterval(() => setText(format(iso, mode)), 60_000);
      return () => clearInterval(t);
    }
  }, [iso, mode]);

  return (
    <span suppressHydrationWarning className={className}>
      {text}
    </span>
  );
}

/** The viewer's timezone name, e.g. "Asia/Kolkata". */
export function LocalTimezone({ className }: { className?: string }) {
  const [tz, setTz] = useState("");
  useEffect(() => {
    try {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setTz("");
    }
  }, []);
  if (!tz) return null;
  return (
    <span suppressHydrationWarning className={className}>
      {tz}
    </span>
  );
}
