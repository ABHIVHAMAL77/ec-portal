import { cn, initials } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-[var(--border)] bg-[var(--bg-card)]", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
      <div>
        <h3 className="font-semibold text-[var(--text)]">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  color,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={
        color
          ? { backgroundColor: `${color}1f`, color, boxShadow: `inset 0 0 0 1px ${color}3d` }
          : { backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }
      }
    >
      {children}
    </span>
  );
}

export function Dot({ color }: { color: string }) {
  return <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md";
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

const buttonVariants: Record<string, string> = {
  primary: "bg-[var(--brand)] text-[#17130a] font-semibold hover:bg-[var(--brand-2)]",
  outline: "border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-hover)]",
  ghost: "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]",
  danger: "bg-[var(--danger)] text-white hover:bg-[#c93f37]",
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        buttonBase,
        buttonVariants[variant],
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
        className
      )}
      {...props}
    />
  );
}

export function Avatar({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${color ?? "#d6a43e"}, ${color ?? "#d6a43e"}bb)`,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-3xl font-bold" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--text-dim)]">{hint}</p>}
    </Card>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
      <p className="font-medium text-[var(--text-muted)]">{title}</p>
      {hint && <p className="mt-1 text-sm text-[var(--text-dim)]">{hint}</p>}
    </div>
  );
}

