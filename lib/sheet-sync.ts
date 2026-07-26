import { prisma } from "./db";

// Google Sheet mirror.
//
// The portal is the source of truth. The Apps Script bound to the sheet pulls
// rows from /api/sheet/export and pushes status edits back to /api/sheet/status.
// Optionally, if SHEET_WEBHOOK_URL is set (the Apps Script Web App URL), the
// portal also pushes immediately when a status changes.

/** Flat row shape shared by the export endpoint and the Apps Script. */
export const SHEET_COLUMNS = [
  "trackingCode",
  "status",
  "category",
  "scope",
  "payeeName",
  "contactEmail",
  "amount",
  "currency",
  "purpose",
  "eventRef",
  "submittedAt",
  "paidAt",
  "receiptNo",
  "paymentTxnRef",
  "reviewNotes",
] as const;

export type SheetRow = Record<(typeof SHEET_COLUMNS)[number], string | number>;

export function toSheetRow(r: {
  trackingCode: string;
  status: string;
  category: string;
  scope: string;
  payeeName: string;
  contactEmail: string;
  amount: number;
  currency: string;
  purpose: string;
  eventRef: string | null;
  createdAt: Date;
  paidAt: Date | null;
  receiptNo: string | null;
  paymentTxnRef: string | null;
  reviewNotes: string | null;
}): SheetRow {
  return {
    trackingCode: r.trackingCode,
    status: r.status,
    category: r.category,
    scope: r.scope,
    payeeName: r.payeeName,
    contactEmail: r.contactEmail,
    amount: r.amount,
    currency: r.currency,
    purpose: r.purpose,
    eventRef: r.eventRef ?? "",
    submittedAt: r.createdAt.toISOString(),
    paidAt: r.paidAt ? r.paidAt.toISOString() : "",
    receiptNo: r.receiptNo ?? "",
    paymentTxnRef: r.paymentTxnRef ?? "",
    reviewNotes: r.reviewNotes ?? "",
  };
}

/**
 * Best-effort push of one request to the sheet's Apps Script Web App.
 * Silently does nothing when not configured; never throws.
 */
export async function pushToSheet(paymentRequestId: string): Promise<void> {
  const url = process.env.SHEET_WEBHOOK_URL;
  const secret = process.env.SHEET_SYNC_SECRET;
  if (!url || !secret) return;

  try {
    const r = await prisma.paymentRequest.findUnique({ where: { id: paymentRequestId } });
    if (!r) return;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, row: toSheetRow(r) }),
      signal: ctrl.signal,
    });
    clearTimeout(t);

    await prisma.paymentRequest.update({
      where: { id: paymentRequestId },
      data: { sheetSyncedAt: new Date() },
    });
  } catch {
    // Sheet sync must never break a payment update.
  }
}
