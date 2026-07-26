import { CURRENCY_SYMBOL, PAYMENT_CATEGORY_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export type ReceiptData = {
  trackingCode: string;
  receiptNo: string | null;
  paidAt: Date | null;
  payeeName: string;
  contactEmail: string;
  addressLine: string | null;
  city: string | null;
  stateRegion: string | null;
  postalCode: string | null;
  country: string | null;
  category: string;
  purpose: string;
  eventRef: string | null;
  amount: number;
  currency: string;
  paymentTxnRef: string | null;
  panOrTin: string | null;
  gstin: string | null;
};

/** Print-ready payment receipt (use the browser's Print → Save as PDF). */
export function ReceiptView({ r }: { r: ReceiptData }) {
  const money = `${CURRENCY_SYMBOL[r.currency] ?? ""}${r.amount.toLocaleString("en-IN")} ${r.currency}`;
  const address = [r.addressLine, r.city, r.stateRegion, r.postalCode, r.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="receipt mx-auto max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 print:border-0 print:bg-white print:text-black">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5 print:border-gray-300">
        <div>
          <div className="text-lg font-bold tracking-wide">ESPORTS COUNTY</div>
          <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--gold-deep)] print:text-gray-600">
            Media &amp; Marketing Solutions Pvt Ltd
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-[var(--text-dim)] print:text-gray-500">
            Payment receipt
          </div>
          <div className="mt-0.5 font-mono text-sm font-semibold">{r.receiptNo ?? "—"}</div>
          <div className="text-xs text-[var(--text-muted)] print:text-gray-600">
            {r.paidAt ? formatDate(r.paidAt) : "—"}
          </div>
        </div>
      </div>

      <div className="grid gap-6 py-5 sm:grid-cols-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[var(--text-dim)] print:text-gray-500">
            Paid to
          </div>
          <div className="mt-1 font-semibold">{r.payeeName}</div>
          <div className="text-sm text-[var(--text-muted)] print:text-gray-600">{r.contactEmail}</div>
          {address && (
            <div className="mt-1 text-sm text-[var(--text-muted)] print:text-gray-600">{address}</div>
          )}
          {r.panOrTin && (
            <div className="mt-1 text-xs text-[var(--text-dim)] print:text-gray-500">
              Tax ID: {r.panOrTin}
            </div>
          )}
          {r.gstin && (
            <div className="text-xs text-[var(--text-dim)] print:text-gray-500">GSTIN: {r.gstin}</div>
          )}
        </div>
        <div className="sm:text-right">
          <div className="text-[11px] uppercase tracking-widest text-[var(--text-dim)] print:text-gray-500">
            Reference
          </div>
          <div className="mt-1 font-mono text-sm">{r.trackingCode}</div>
          {r.paymentTxnRef && (
            <div className="mt-1 text-xs text-[var(--text-muted)] print:text-gray-600">
              Bank ref: {r.paymentTxnRef}
            </div>
          )}
        </div>
      </div>

      <table className="w-full border-t border-[var(--border)] text-sm print:border-gray-300">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-widest text-[var(--text-dim)] print:text-gray-500">
            <th className="py-2.5">Description</th>
            <th className="py-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-[var(--border)] print:border-gray-200">
            <td className="py-3 pr-4 align-top">
              <div className="font-medium">{PAYMENT_CATEGORY_LABEL[r.category] ?? r.category}</div>
              <div className="mt-0.5 text-[var(--text-muted)] print:text-gray-600">{r.purpose}</div>
              {r.eventRef && (
                <div className="mt-0.5 text-xs text-[var(--text-dim)] print:text-gray-500">
                  Event: {r.eventRef}
                </div>
              )}
            </td>
            <td className="py-3 text-right align-top font-medium">{money}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-[var(--border)] print:border-gray-400">
            <td className="py-3 text-right font-semibold">Total paid</td>
            <td className="py-3 text-right text-lg font-bold text-[var(--brand)] print:text-black">
              {money}
            </td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-6 border-t border-[var(--border)] pt-4 text-[11px] leading-relaxed text-[var(--text-dim)] print:border-gray-300 print:text-gray-500">
        This is a computer-generated receipt confirming payment has been released by Esports County
        Media &amp; Marketing Solutions Pvt Ltd. Amounts shown are as remitted; applicable taxes were
        deducted at source where required by law.
      </p>
    </div>
  );
}
