import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ReceiptView } from "@/components/receipt-view";
import { PrintButton } from "@/components/print-button";
import { LogoMark } from "@/components/logo";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Payment receipt — Esports County" };

// Public receipt, but only openable with BOTH the tracking code and the
// submitting email — so a code alone reveals nothing.
export default async function PublicReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { code } = await params;
  const { email } = await searchParams;
  if (!email) notFound();

  const r = await prisma.paymentRequest.findUnique({
    where: { trackingCode: decodeURIComponent(code).toUpperCase() },
  });

  if (!r || r.contactEmail.toLowerCase() !== email.trim().toLowerCase() || r.status !== "paid") {
    notFound();
  }

  return (
    <div className="brand-glow min-h-screen print:bg-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 print:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={36} />
          <span className="silver-text text-sm font-bold tracking-wide">ESPORTS COUNTY</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/track?code=${encodeURIComponent(r.trackingCode)}`}
            className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={14} /> Back to status
          </Link>
          <PrintButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16 print:p-0">
        <ReceiptView r={r} />
      </main>
    </div>
  );
}
