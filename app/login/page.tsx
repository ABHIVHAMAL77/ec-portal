import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { LogoMark } from "@/components/logo";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="brand-glow flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl md:grid md:grid-cols-2">
        {/* Left / brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-[#15130c] to-[#090a0d] p-10 md:flex">
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "url('/hex-pattern.svg')" }} />
          <div className="relative flex items-center gap-3">
            <LogoMark size={48} />
            <div>
              <div className="silver-text font-bold tracking-wide">ESPORTS COUNTY</div>
              <div className="text-xs uppercase tracking-[0.2em] text-[var(--gold-deep)]">
                Media &amp; Marketing
              </div>
            </div>
          </div>
          <div className="relative">
            <h1 className="text-3xl font-bold leading-tight">
              Run every event <span className="brand-gradient-text">like a broadcast.</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              Events, KPIs, department tasks, attendance and reports — one portal for the whole
              team, from planning to live stream.
            </p>
          </div>
          <div className="relative flex gap-6 text-xs text-[var(--gold-deep)]">
            <span>Events</span>
            <span>KPIs</span>
            <span>Tasks</span>
            <span>Reports</span>
          </div>
        </div>

        {/* Right / form */}
        <div className="p-8 md:p-10">
          <div className="mb-6 md:hidden">
            <div className="flex items-center gap-2.5">
              <LogoMark size={36} />
              <span className="silver-text font-bold tracking-wide">ESPORTS COUNTY</span>
            </div>
          </div>
          <h2 className="text-xl font-semibold">Welcome back</h2>
          <p className="mb-6 mt-1 text-sm text-[var(--text-muted)]">
            Sign in to the Esports County Employers Portal.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
