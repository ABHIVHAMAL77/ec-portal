import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { PayForm } from "@/components/pay/pay-form";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata = {
  title: "Payment submission — Esports County",
  description: "Submit your invoice, tax documents and bank details securely.",
};

export default function PayPage() {
  return (
    <div className="brand-glow min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={36} />
          <span className="silver-text text-sm font-bold tracking-wide">ESPORTS COUNTY</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          <ArrowLeft size={14} /> Home
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16">
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">Payment submission</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
            <Lock size={13} className="text-[var(--brand)]" />
            Your details are encrypted in transit and seen only by our finance team.
          </p>
        </div>

        <PayForm />
      </main>
    </div>
  );
}
