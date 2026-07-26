import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function relativeDay(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  const diff = Math.round(
    (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      86400000
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return `in ${diff}d`;
}

export function timeAgo(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// Detect the kind of an attached link from its URL, for icon/label.
export function detectKind(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("docs.google.com/spreadsheets") || u.includes(".xlsx") || u.includes(".csv")) return "sheet";
  if (u.includes("docs.google.com/presentation") || u.includes(".pptx") || u.includes(".ppt")) return "slides";
  if (u.includes("docs.google.com/document") || u.includes(".docx")) return "doc";
  if (u.includes("figma.com")) return "figma";
  if (u.includes("drive.google.com")) return "drive";
  if (/\.(png|jpe?g|gif|webp|svg)(\?|$)/.test(u)) return "image";
  return "link";
}

// Monday-based start of the current week.
export function weekStart(date = new Date()): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}
