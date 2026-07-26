"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isFinanceViewer } from "@/lib/access";
import { sendEmail, emailHtml } from "@/lib/email";
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_PAYEE_MESSAGE,
  CURRENCY_SYMBOL,
} from "@/lib/constants";
import { pushToSheet } from "@/lib/sheet-sync";

function receiptNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `EC/RCPT/${y}/${rand}`;
}

/**
 * Change a payment request's status. Records a timeline event, emails the
 * payee, issues a receipt when marked paid, and mirrors to the Google Sheet.
 * `source` is "portal" for staff actions and "sheet" for sheet-driven updates.
 */
export async function setPaymentStatus(
  id: string,
  status: string,
  opts: { note?: string; txnRef?: string; source?: "portal" | "sheet"; actorId?: string | null } = {}
) {
  const source = opts.source ?? "portal";
  let actorId = opts.actorId ?? null;

  if (source === "portal") {
    const user = await requireUser();
    if (!(await isFinanceViewer(user))) return { error: "You don't have access to payments." };
    actorId = user.id;
  }

  if (!PAYMENT_STATUSES.includes(status as (typeof PAYMENT_STATUSES)[number])) {
    return { error: "Unknown status." };
  }

  const request = await prisma.paymentRequest.findUnique({ where: { id } });
  if (!request) return { error: "Payment request not found." };

  const note = opts.note?.trim() || null;
  const goingPaid = status === "paid" && request.status !== "paid";

  const updated = await prisma.paymentRequest.update({
    where: { id },
    data: {
      status,
      reviewNotes: note ?? request.reviewNotes,
      reviewedById: actorId ?? request.reviewedById,
      ...(opts.txnRef ? { paymentTxnRef: opts.txnRef.trim() } : {}),
      ...(goingPaid
        ? {
            paidAt: new Date(),
            receiptNo: request.receiptNo ?? receiptNumber(),
            receiptIssuedAt: new Date(),
          }
        : {}),
    },
  });

  await prisma.paymentStatusEvent.create({
    data: { paymentRequestId: id, status, note, changedById: actorId, source },
  });

  // Tell the payee.
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const money = `${CURRENCY_SYMBOL[updated.currency] ?? ""}${updated.amount.toLocaleString("en-IN")} ${updated.currency}`;
  await sendEmail({
    to: updated.contactEmail,
    subject: `${updated.trackingCode} — ${PAYMENT_STATUS_LABEL[status]}`,
    html: emailHtml(
      `<p>Hi ${updated.payeeName},</p>
       <p>Your payment submission <b>${updated.trackingCode}</b> (${money}) is now
       <b style="color:#d6a43e">${PAYMENT_STATUS_LABEL[status]}</b>.</p>
       <p>${PAYMENT_STATUS_PAYEE_MESSAGE[status] ?? ""}</p>
       ${note ? `<p style="color:#99a2b1"><b>Note from our team:</b><br/>${note}</p>` : ""}
       ${
         goingPaid && updated.receiptNo
           ? `<p>Receipt no. <b>${updated.receiptNo}</b>${
               updated.paymentTxnRef ? ` · Bank ref: ${updated.paymentTxnRef}` : ""
             }</p>`
           : ""
       }
       <p>You can view the full status any time at
       <a href="${appUrl}/track" style="color:#d6a43e">${appUrl}/track</a> using your tracking code
       and this email address.</p>`,
      "/track"
    ),
  });

  // Mirror to the Google Sheet (never blocks the update).
  await pushToSheet(id);

  // Only valid inside a request/render scope — a sheet-driven update runs
  // outside one, and must not fail because of cache revalidation.
  try {
    revalidatePath("/payments");
    revalidatePath(`/payments/${id}`);
  } catch {
    // no-op
  }
  return { ok: true };
}
