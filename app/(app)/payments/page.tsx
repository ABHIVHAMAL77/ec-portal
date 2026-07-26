import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isFinanceViewer } from "@/lib/access";
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
  PAYMENT_CATEGORIES,
  PAYMENT_CATEGORY_LABEL,
  CURRENCY_SYMBOL,
} from "@/lib/constants";
import { Card, Badge, Stat, EmptyState, Dot } from "@/components/ui";
import { CsvExport } from "@/components/csv-export";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";

function money(amount: number, currency: string) {
  return `${CURRENCY_SYMBOL[currency] ?? ""}${amount.toLocaleString("en-IN")}`;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}) {
  const user = await requireUser();
  if (!(await isFinanceViewer(user))) notFound();

  const { status, category, q } = await searchParams;

  const where = {
    ...(status && PAYMENT_STATUSES.includes(status as never) ? { status } : {}),
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { trackingCode: { contains: q } },
            { payeeName: { contains: q } },
            { contactEmail: { contains: q } },
            { purpose: { contains: q } },
          ],
        }
      : {}),
  };

  const [requests, all] = await Promise.all([
    prisma.paymentRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { documents: true } } },
    }),
    prisma.paymentRequest.findMany({
      select: { status: true, amount: true, currency: true, paidAt: true },
    }),
  ]);

  const pending = all.filter((r) => ["submitted", "under_review"].includes(r.status)).length;
  const approved = all.filter((r) => r.status === "approved").length;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const paidThisMonth = all.filter((r) => r.paidAt && r.paidAt >= monthStart);

  // Total paid this month, grouped by currency (never sum across currencies).
  const paidByCurrency = paidThisMonth.reduce<Record<string, number>>((acc, r) => {
    acc[r.currency] = (acc[r.currency] ?? 0) + r.amount;
    return acc;
  }, {});
  const paidSummary =
    Object.entries(paidByCurrency)
      .map(([c, amt]) => money(amt, c))
      .join(" · ") || "—";

  const csvRows = requests.map((r) => [
    r.trackingCode,
    PAYMENT_STATUS_LABEL[r.status] ?? r.status,
    PAYMENT_CATEGORY_LABEL[r.category] ?? r.category,
    r.scope,
    r.payeeName,
    r.contactEmail,
    r.amount,
    r.currency,
    r.purpose,
    r.eventRef ?? "",
    formatDate(r.createdAt),
    r.paidAt ? formatDate(r.paidAt) : "",
    r.receiptNo ?? "",
    r.paymentTxnRef ?? "",
  ]);

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? "bg-[var(--brand)] text-[#17130a]"
        : "border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
    }`;

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, category, q, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/payments?${s}` : "/payments";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Payments</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Submissions from vendors, players, influencers, freelancers and staff.
          </p>
        </div>
        <CsvExport
          filename="esports-county-payments.csv"
          headers={[
            "Tracking code", "Status", "Category", "Scope", "Payee", "Email", "Amount",
            "Currency", "Purpose", "Event", "Submitted", "Paid on", "Receipt no", "Bank ref",
          ]}
          rows={csvRows}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Awaiting review" value={pending} accent={pending > 0 ? "var(--warning)" : undefined} />
        <Stat label="Approved, to pay" value={approved} accent="var(--brand)" />
        <Stat label="Paid this month" value={paidThisMonth.length} accent="var(--success)" />
        <Stat label="Value paid (month)" value={paidSummary} hint="by currency" />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <form action="/payments" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          {category && <input type="hidden" name="category" value={category} />}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search tracking code, payee, email or purpose…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--brand)]"
            />
          </div>
          <button className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-hover)]">
            Search
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          <Link href={qs({ status: undefined })} className={chip(!status)}>All statuses</Link>
          {PAYMENT_STATUSES.map((s) => (
            <Link key={s} href={qs({ status: s })} className={chip(status === s)}>
              {PAYMENT_STATUS_LABEL[s]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link href={qs({ category: undefined })} className={chip(!category)}>All types</Link>
          {PAYMENT_CATEGORIES.map((c) => (
            <Link key={c} href={qs({ category: c })} className={chip(category === c)}>
              {PAYMENT_CATEGORY_LABEL[c]}
            </Link>
          ))}
        </div>
      </div>

      <Card>
        {requests.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No payment submissions"
              hint={q || status || category ? "Try clearing the filters." : "They'll appear here as payees submit."}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)] text-left text-xs text-[var(--text-dim)]">
                <tr>
                  <th className="px-4 py-2.5">Tracking</th>
                  <th className="px-3 py-2.5">Payee</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-3 py-2.5">Submitted</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="px-4 py-3">
                      <Link href={`/payments/${r.id}`} className="font-mono text-xs font-medium text-[var(--brand-2)] hover:underline">
                        {r.trackingCode}
                      </Link>
                      <div className="text-[11px] text-[var(--text-dim)]">{r._count.documents} docs</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{r.payeeName}</div>
                      <div className="truncate text-[11px] text-[var(--text-dim)]">{r.contactEmail}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs">{PAYMENT_CATEGORY_LABEL[r.category] ?? r.category}</div>
                      <div className="text-[11px] capitalize text-[var(--text-dim)]">{r.scope}</div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      {money(r.amount, r.currency)}
                      <span className="ml-1 text-[11px] text-[var(--text-dim)]">{r.currency}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-[var(--text-muted)]">{formatDate(r.createdAt)}</td>
                    <td className="px-3 py-3">
                      <Badge color={PAYMENT_STATUS_COLOR[r.status]}>
                        <Dot color={PAYMENT_STATUS_COLOR[r.status]} />
                        {PAYMENT_STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
