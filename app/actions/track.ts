"use server";

import { prisma } from "@/lib/db";
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
  PAYMENT_STATUS_PAYEE_MESSAGE,
  PAYMENT_CATEGORY_LABEL,
  CURRENCY_SYMBOL,
} from "@/lib/constants";

export type TrackResult =
  | { error: string }
  | {
      ok: true;
      trackingCode: string;
      status: string;
      statusLabel: string;
      statusColor: string;
      statusMessage: string;
      payeeName: string;
      categoryLabel: string;
      amountLabel: string;
      purpose: string;
      submittedAt: string;
      paidAt: string | null;
      receiptNo: string | null;
      reviewNote: string | null;
      canDownloadReceipt: boolean;
      timeline: { status: string; label: string; color: string; note: string | null; at: string }[];
    };

/**
 * Public lookup. Requires BOTH the tracking code and the email used to submit,
 * so one alone can't reveal anything. Never returns bank or tax details.
 */
export async function trackPayment(codeRaw: string, emailRaw: string): Promise<TrackResult> {
  const code = codeRaw.trim().toUpperCase();
  const email = emailRaw.trim().toLowerCase();
  if (!code || !email) return { error: "Please enter both your tracking code and email address." };

  const r = await prisma.paymentRequest.findUnique({
    where: { trackingCode: code },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });

  // Same message either way — don't reveal whether a code exists.
  if (!r || r.contactEmail.toLowerCase() !== email) {
    return { error: "We couldn't find a submission with that code and email address." };
  }

  return {
    ok: true,
    trackingCode: r.trackingCode,
    status: r.status,
    statusLabel: PAYMENT_STATUS_LABEL[r.status] ?? r.status,
    statusColor: PAYMENT_STATUS_COLOR[r.status] ?? "#8b95ad",
    statusMessage: PAYMENT_STATUS_PAYEE_MESSAGE[r.status] ?? "",
    payeeName: r.payeeName,
    categoryLabel: PAYMENT_CATEGORY_LABEL[r.category] ?? r.category,
    amountLabel: `${CURRENCY_SYMBOL[r.currency] ?? ""}${r.amount.toLocaleString("en-IN")} ${r.currency}`,
    purpose: r.purpose,
    submittedAt: r.createdAt.toISOString(),
    paidAt: r.paidAt ? r.paidAt.toISOString() : null,
    receiptNo: r.receiptNo,
    reviewNote: ["on_hold", "rejected"].includes(r.status) ? r.reviewNotes : null,
    canDownloadReceipt: r.status === "paid",
    timeline: r.events.map((e) => ({
      status: e.status,
      label: PAYMENT_STATUS_LABEL[e.status] ?? e.status,
      color: PAYMENT_STATUS_COLOR[e.status] ?? "#8b95ad",
      note: e.note,
      at: e.createdAt.toISOString(),
    })),
  };
}
