import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { TrackView } from "@/components/track-view";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Track your payment — Esports County",
  description: "Check the status of your payment submission and download your receipt.",
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

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
          <h1 className="text-2xl font-bold md:text-3xl">Track your payment</h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            Enter the tracking code from your confirmation email, along with the email address you
            used to submit.
          </p>
        </div>

        <TrackView initialCode={code ?? ""} />
      </main>
    </div>
  );
}
