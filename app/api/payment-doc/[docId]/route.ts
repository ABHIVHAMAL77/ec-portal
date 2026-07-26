import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isFinanceViewer } from "@/lib/access";
import { readUpload } from "@/lib/uploads";

// Payment documents contain bank and tax data, so they are stored outside the
// web root and streamed only to finance viewers.
export async function GET(_req: Request, ctx: { params: Promise<{ docId: string }> }) {
  const { docId } = await ctx.params;

  const user = await getCurrentUser();
  if (!user || !(await isFinanceViewer(user))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const doc = await prisma.paymentDocument.findUnique({ where: { id: docId } });
  if (!doc) return new NextResponse("Not found", { status: 404 });

  try {
    const buf = await readUpload(doc.storedName);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${doc.originalName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("File missing", { status: 404 });
  }
}
