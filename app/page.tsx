import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { FileText, ShieldCheck, Search, ArrowRight, Landmark, FileSpreadsheet } from "lucide-react";

export const metadata = {
  title: "Esports County — Payments",
  description:
    "Submit an invoice or payment request to Esports County Media & Marketing, and track its status.",
};

const steps = [
  {
    icon: FileText,
    title: "Submit your details",
    body: "Fill the secure form with your invoice, tax documents and bank details.",
  },
  {
    icon: ShieldCheck,
    title: "We verify & approve",
    body: "Our finance team reviews the submission and approves it for payment.",
  },
  {
    icon: Landmark,
    title: "Payment & receipt",
    body: "We transfer the funds and issue you a receipt you can download.",
  },
];

export default function Home() {
  return (
    <div className="brand-glow min-h-screen">
      {/* Header */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <LogoMark size={40} />
          <div className="leading-tight">
            <div className="silver-text text-sm font-bold tracking-wide">ESPORTS COUNTY</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold-deep)]">
              Media &amp; Marketing
            </div>
          </div>
        </div>
        <Link
          href="/login"
          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--text)]"
        >
          Employees →
        </Link>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="pt-10 text-center md:pt-16">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--gold-deep)]">
            Vendor &amp; Partner Payments
          </p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Get paid by <span className="brand-gradient-text">Esports County</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--text-muted)]">
            Vendors, players, influencers, freelancers and staff — submit your invoice and payment
            details securely. You&apos;ll get a tracking code to follow your payment from submission
            to receipt.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/pay"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3.5 text-base font-semibold text-[#17130a] shadow-lg transition-colors hover:bg-[var(--brand-2)] sm:w-auto"
            >
              Make a payment submission <ArrowRight size={18} />
            </Link>
            <Link
              href="/track"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3.5 text-base font-medium text-[var(--text)] transition-colors hover:border-[var(--brand)] hover:bg-[var(--bg-hover)] sm:w-auto"
            >
              <Search size={17} /> Track my submission
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)]/15 text-[var(--brand)]">
                  <s.icon size={18} />
                </span>
                <span className="text-xs font-semibold text-[var(--text-dim)]">STEP {i + 1}</span>
              </div>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{s.body}</p>
            </div>
          ))}
        </section>

        {/* Notes */}
        <section className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-5">
          <h3 className="text-sm font-semibold">Before you start, please have ready</h3>
          <ul className="mt-2 grid gap-1.5 text-sm text-[var(--text-muted)] md:grid-cols-2">
            <li>• Your invoice (PDF or image)</li>
            <li>• Your email address and phone number (with country code)</li>
            <li>• Bank details — IFSC for India, SWIFT/IBAN for international</li>
            <li>• PAN / Tax ID (and GST certificate if registered)</li>
            <li>
              • International payees: <strong className="text-[var(--text)]">Tax Residence
              Certificate (TRC)</strong>, Form 10F and a No-PE declaration
            </li>
          </ul>
          <a
            href="/esports-county-invoice-template.xlsx"
            download
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium transition-colors hover:border-[var(--brand)]"
          >
            <FileSpreadsheet size={16} className="text-[var(--brand)]" />
            Download our invoice template (Excel)
          </a>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-5 text-xs text-[var(--text-dim)] sm:flex-row">
          <span>
            © {new Date().getFullYear()} Esports County Media &amp; Marketing Solutions Pvt Ltd
          </span>
          <Link href="/login" className="hover:text-[var(--text-muted)]">
            Employee portal
          </Link>
        </div>
      </footer>
    </div>
  );
}
