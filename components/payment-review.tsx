"use client";

import { useState, useTransition } from "react";
import { setPaymentStatus } from "@/app/actions/payment-review";
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_COLOR } from "@/lib/constants";

export function PaymentReview({
  id,
  current,
  txnRef,
}: {
  id: string;
  current: string;
  txnRef: string | null;
}) {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState(current);
  const [note, setNote] = useState("");
  const [ref, setRef] = useState(txnRef ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function apply() {
    start(async () => {
      setError(null);
      setSaved(false);
      const res = await setPaymentStatus(id, status, { note, txnRef: ref });
      if (res?.error) setError(res.error);
      else {
        setSaved(true);
        setNote("");
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Set status</p>
        <div className="flex flex-wrap gap-1.5">
          {PAYMENT_STATUSES.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={
                  active
                    ? {
                        backgroundColor: `${PAYMENT_STATUS_COLOR[s]}26`,
                        color: PAYMENT_STATUS_COLOR[s],
                        boxShadow: `inset 0 0 0 1px ${PAYMENT_STATUS_COLOR[s]}`,
                      }
                    : { backgroundColor: "var(--bg-elev)", color: "var(--text-dim)" }
                }
              >
                {PAYMENT_STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
          Note to the payee (optional)
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. TRC has expired — please upload the current year's certificate."
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>

      {status === "paid" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
            Bank transaction reference
          </label>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="UTR / SWIFT reference"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
          />
          <p className="mt-1 text-[11px] text-[var(--text-dim)]">
            Marking as paid issues a receipt and emails it to the payee.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {saved && <p className="text-sm text-[var(--success)]">✅ Updated and payee notified.</p>}

      <button
        onClick={apply}
        disabled={pending}
        className="w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[#17130a] hover:bg-[var(--brand-2)] disabled:opacity-50"
      >
        {pending ? "Saving…" : "Update status & notify payee"}
      </button>
    </div>
  );
}
