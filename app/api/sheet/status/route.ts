import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setPaymentStatus } from "@/app/actions/payment-review";
import { PAYMENT_STATUSES } from "@/lib/constants";

// Called by the Google Apps Script when someone edits the Status cell in the
// sheet. Updates the portal, records a timeline event (source: "sheet") and
// emails the payee — exactly as a change made inside the portal would.
export async function POST(req: Request) {
  const secret = process.env.SHEET_SYNC_SECRET;
  if (!secret) return NextResponse.json({ error: "Sync not configured" }, { status: 503 });

  let body: { secret?: string; trackingCode?: string; status?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.secret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = String(body.trackingCode ?? "").trim().toUpperCase();
  const status = String(body.status ?? "").trim().toLowerCase().replace(/\s+/g, "_");

  if (!code) return NextResponse.json({ error: "trackingCode is required" }, { status: 400 });
  if (!PAYMENT_STATUSES.includes(status as (typeof PAYMENT_STATUSES)[number])) {
    return NextResponse.json(
      { error: `status must be one of: ${PAYMENT_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const request = await prisma.paymentRequest.findUnique({ where: { trackingCode: code } });
  if (!request) return NextResponse.json({ error: "Unknown tracking code" }, { status: 404 });

  if (request.status === status) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const res = await setPaymentStatus(request.id, status, {
    note: body.note,
    source: "sheet",
  });
  if (res?.error) return NextResponse.json({ error: res.error }, { status: 400 });

  return NextResponse.json({ ok: true, trackingCode: code, status });
}
