import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SHEET_COLUMNS, toSheetRow } from "@/lib/sheet-sync";

// Called by the Google Apps Script to pull all payment requests into the sheet.
// Protected by the shared secret in SHEET_SYNC_SECRET.
export async function GET(req: Request) {
  const secret = process.env.SHEET_SYNC_SECRET;
  const given = new URL(req.url).searchParams.get("secret");

  if (!secret || given !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.paymentRequest.findMany({ orderBy: { createdAt: "desc" } });

  return NextResponse.json({
    columns: SHEET_COLUMNS,
    rows: requests.map(toSheetRow),
  });
}
