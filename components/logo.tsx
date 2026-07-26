"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// Renders the EC emblem: the real logo image (/ec-logo.png) if present,
// otherwise the CSS octagon badge as a graceful fallback. The mount-time
// check catches a 404 that happens before React attaches onError (hydration).
export function LogoMark({ size = 36 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <div
        className="ec-badge flex items-center justify-center font-black"
        style={{ width: size, height: size, fontSize: size * 0.34 }}
      >
        EC
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src="/ec-logo.png"
      alt="Esports County"
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <LogoMark size={36} />
      {!compact && (
        <div className="leading-tight">
          <div className="silver-text text-sm font-bold tracking-wide">ESPORTS COUNTY</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--gold-deep)]">
            Employers Portal
          </div>
        </div>
      )}
    </Link>
  );
}
