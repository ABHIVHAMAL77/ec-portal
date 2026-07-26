import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { CheckCircle2, Search, Mail } from "lucide-react";

export const metadata = { title: "Submission received — Esports County" };

export default async function PaySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="brand-glow flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-2xl px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={36} />
          <span className="silver-text text-sm font-bold tracking-wide">ESPORTS COUNTY</span>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--success)]/15 text-[var(--success)]">
            <CheckCircle2 size={30} />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Submission received</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Thank you. Our finance team will review your submission and keep you updated by email.
          </p>

          {code && (
            <div className="mt-6 rounded-xl border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-5 py-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--gold-deep)]">
                Your tracking code
              </p>
              <p className="mt-1.5 font-mono text-2xl font-bold tracking-wider text-[var(--brand-2)]">
                {code}
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Save this code — you&apos;ll need it (with your email) to check your status.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-2.5 text-left">
            <div className="flex items-start gap-2.5 rounded-lg bg-[var(--bg-elev)] px-3.5 py-3 text-sm">
              <Mail size={16} className="mt-0.5 shrink-0 text-[var(--brand)]" />
              <span className="text-[var(--text-muted)]">
                We&apos;ve emailed your tracking code. If it isn&apos;t in your inbox, please check spam.
              </span>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg bg-[var(--bg-elev)] px-3.5 py-3 text-sm">
              <Search size={16} className="mt-0.5 shrink-0 text-[var(--brand)]" />
              <span className="text-[var(--text-muted)]">
                Track your payment any time — you&apos;ll be able to download your receipt once paid.
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href={code ? `/track?code=${encodeURIComponent(code)}` : "/track"}
              className="rounded-lg bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-[#17130a] hover:bg-[var(--brand-2)]"
            >
              Track my submission
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
