"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-[#17130a] hover:bg-[var(--brand-2)] print:hidden"
    >
      <Printer size={15} /> {label}
    </button>
  );
}
