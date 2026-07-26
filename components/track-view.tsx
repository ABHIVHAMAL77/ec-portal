"use client";

import { useState, useTransition, useEffect } from "react";
import { trackPayment, type TrackResult } from "@/app/actions/track";
import { AlertCircle, Search, FileDown } from "lucide-react";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrackView({ initialCode = "" }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => setCode(initialCode), [initialCode]);

  const found = result && "ok" in result ? result : null;
  const error = result && "error" in result ? result.error : null;

  function look() {
    start(async () => setResult(await trackPayment(code, email)));
  }

  const input =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand)]";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              Tracking code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="EC-PAY-XXXXX"
              className={`${input} font-mono uppercase`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
              Email you submitted with
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && look()}
              placeholder="you@example.com"
              className={input}
            />
          </div>
          <button
            onClick={look}
            disabled={pending}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[#17130a] hover:bg-[var(--brand-2)] disabled:opacity-50"
          >
            <Search size={15} /> {pending ? "Checking…" : "Check status"}
          </button>
        </div>

        {error && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2.5 text-sm text-[var(--danger)]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
      </div>

      {found && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-[var(--text-dim)]">{found.trackingCode}</p>
                <p className="mt-1 text-lg font-semibold">{found.payeeName}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {found.categoryLabel} · {found.amountLabel}
                </p>
              </div>
              <span
                className="rounded-full px-3.5 py-1.5 text-sm font-semibold"
                style={{
                  backgroundColor: `${found.statusColor}22`,
                  color: found.statusColor,
                  boxShadow: `inset 0 0 0 1px ${found.statusColor}`,
                }}
              >
                {found.statusLabel}
              </span>
            </div>

            <p className="mt-4 rounded-lg bg-[var(--bg-elev)] px-4 py-3 text-sm text-[var(--text-muted)]">
              {found.statusMessage}
            </p>

            {found.reviewNote && (
              <p className="mt-3 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]">
                <b>Note from our team:</b> {found.reviewNote}
              </p>
            )}

            {found.canDownloadReceipt && (
              <a
                href={`/receipt/${found.trackingCode}?email=${encodeURIComponent(email)}`}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[#17130a] hover:bg-[var(--brand-2)]"
              >
                <FileDown size={16} /> View / download receipt
                {found.receiptNo ? ` (${found.receiptNo})` : ""}
              </a>
            )}
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <h3 className="mb-4 text-sm font-semibold">Progress</h3>
            <ol className="space-y-4">
              {found.timeline.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    {i < found.timeline.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-[var(--border)]" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-medium">{t.label}</p>
                    {t.note && <p className="text-xs text-[var(--text-muted)]">{t.note}</p>}
                    <p className="text-[11px] text-[var(--text-dim)]">{fmt(t.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
