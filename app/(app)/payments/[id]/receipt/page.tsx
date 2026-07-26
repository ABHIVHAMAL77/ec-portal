import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isFinanceViewer } from "@/lib/access";
import { ReceiptView } from "@/components/receipt-view";
import { PrintButton } from "@/components/print-button";
import { ArrowLeft } from "lucide-react";

export default async function FinanceReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!(await isFinanceViewer(user))) notFound();

  const r = await prisma.paymentRequest.findUnique({ where: { id } });
  if (!r || r.status !== "paid") notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/payments/${r.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft size={15} /> Back to submission
        </Link>
        <PrintButton />
      </div>
      <ReceiptView r={r} />
    </div>
  );
}
