import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isFinanceViewer } from "@/lib/access";
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
  PAYMENT_CATEGORY_LABEL,
  PAYMENT_SCOPE_LABEL,
  PAYEE_TYPE_LABEL,
  PAYMENT_DOC_LABEL,
  CURRENCY_SYMBOL,
} from "@/lib/constants";
import { Card, CardHeader, Badge, Dot, EmptyState } from "@/components/ui";
import { PaymentReview } from "@/components/payment-review";
import { formatDate, timeAgo } from "@/lib/utils";
import { ArrowLeft, FileText, Download, ShieldAlert, Printer } from "lucide-react";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--border)] py-2 text-sm last:border-0">
      <span className="shrink-0 text-[var(--text-dim)]">{label}</span>
      <span className="text-right font-medium break-all">{value}</span>
    </div>
  );
}

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!(await isFinanceViewer(user))) notFound();

  const r = await prisma.paymentRequest.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { createdAt: "asc" } },
      events: {
        orderBy: { createdAt: "desc" },
        include: { changedBy: { select: { fullName: true } } },
      },
      reviewedBy: { select: { fullName: true } },
    },
  });
  if (!r) notFound();

  const intl = r.scope === "international";
  const money = `${CURRENCY_SYMBOL[r.currency] ?? ""}${r.amount.toLocaleString("en-IN")} ${r.currency}`;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link href="/payments" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
        <ArrowLeft size={15} /> All payments
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-mono text-xl font-bold text-[var(--brand-2)]">{r.trackingCode}</h2>
            <Badge color={PAYMENT_STATUS_COLOR[r.status]}>
              <Dot color={PAYMENT_STATUS_COLOR[r.status]} />
              {PAYMENT_STATUS_LABEL[r.status] ?? r.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {r.payeeName} · {money} · submitted {formatDate(r.createdAt)}
          </p>
        </div>
        {r.status === "paid" && (
          <Link
            href={`/payments/${r.id}/receipt`}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--bg-hover)]"
          >
            <Printer size={15} /> Receipt
          </Link>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader title="Submission" subtitle={PAYMENT_CATEGORY_LABEL[r.category] ?? r.category} />
            <div className="px-5 py-3">
              <Row label="Payment for" value={PAYMENT_CATEGORY_LABEL[r.category] ?? r.category} />
              <Row label="Type" value={`${PAYMENT_SCOPE_LABEL[r.scope]} · ${PAYEE_TYPE_LABEL[r.payeeType]}`} />
              <Row label="Amount" value={money} />
              <Row label="Purpose" value={r.purpose} />
              <Row label="Event / reference" value={r.eventRef} />
              <Row label="Payee" value={r.payeeName} />
              <Row label="Email" value={r.contactEmail} />
              <Row label="Phone" value={r.contactPhone} />
              <Row
                label="Address"
                value={[r.addressLine, r.city, r.stateRegion, r.postalCode, r.country]
                  .filter(Boolean)
                  .join(", ")}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Tax & compliance" />
            <div className="px-5 py-3">
              <Row label={intl ? "Tax ID / TIN" : "PAN"} value={r.panOrTin} />
              <Row label="GSTIN" value={r.gstin} />
              <Row label="Tax residency" value={r.taxResidencyCountry} />
              <Row label="Form 10F details" value={r.form10fInfo} />
              <Row label="No-PE declared" value={r.noPeDeclared ? "Yes" : "No"} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Bank details" subtitle="Pay exactly as entered by the payee" />
            <div className="px-5 py-3">
              <Row label="Account holder" value={r.beneficiaryName} />
              <Row label="Bank" value={r.bankName} />
              <Row label="Account number" value={r.accountNumber} />
              <Row label="IFSC" value={r.ifsc} />
              <Row label="IBAN" value={r.iban} />
              <Row label="SWIFT / BIC" value={r.swiftBic} />
              <Row label="Intermediary bank" value={r.intermediaryBank} />
              <Row label="Bank address" value={r.bankAddress} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Documents" subtitle={`${r.documents.length} uploaded`} />
            <div className="p-4">
              {r.documents.length === 0 ? (
                <EmptyState title="No documents" />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {r.documents.map((d) => (
                    <a
                      key={d.id}
                      href={`/api/payment-doc/${d.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2.5 hover:border-[var(--brand)]"
                    >
                      <FileText size={16} className="shrink-0 text-[var(--brand)]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {PAYMENT_DOC_LABEL[d.kind] ?? d.kind}
                        </p>
                        <p className="truncate text-[11px] text-[var(--text-dim)]">
                          {d.originalName} · {(d.sizeBytes / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <Download size={14} className="shrink-0 text-[var(--text-dim)]" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Card>
            <CardHeader title="Review" subtitle="Update status and notify the payee" />
            <div className="p-4">
              <PaymentReview id={r.id} current={r.status} txnRef={r.paymentTxnRef} />
            </div>
          </Card>

          {(r.paidAt || r.receiptNo || r.paymentTxnRef) && (
            <Card>
              <CardHeader title="Payment record" />
              <div className="px-5 py-3">
                <Row label="Paid on" value={r.paidAt ? formatDate(r.paidAt) : null} />
                <Row label="Receipt no." value={r.receiptNo} />
                <Row label="Bank ref" value={r.paymentTxnRef} />
                <Row label="Reviewed by" value={r.reviewedBy?.fullName} />
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Agreement" />
            <div className="px-5 py-3">
              <Row label="Accepted" value={r.agreementAccepted ? "Yes" : "No"} />
              <Row label="Signed by" value={r.signerName} />
              <Row
                label="Accepted at"
                value={r.agreementAcceptedAt ? formatDate(r.agreementAcceptedAt) : null}
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-[var(--text-dim)]" /> Submission origin
                </span>
              }
              subtitle="For abuse review"
            />
            <div className="px-5 py-3">
              <Row label="IP address" value={r.submitIp ?? "—"} />
              <Row label="Network / ISP" value={r.submitIsp ?? "—"} />
            </div>
          </Card>

          <Card>
            <CardHeader title="History" />
            <div className="space-y-3 p-4">
              {r.events.map((e) => (
                <div key={e.id} className="flex gap-3">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: PAYMENT_STATUS_COLOR[e.status] ?? "var(--text-dim)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{PAYMENT_STATUS_LABEL[e.status] ?? e.status}</p>
                    {e.note && <p className="text-xs text-[var(--text-muted)]">{e.note}</p>}
                    <p className="text-[11px] text-[var(--text-dim)]">
                      {timeAgo(e.createdAt)}
                      {e.changedBy ? ` · ${e.changedBy.fullName}` : ""}
                      {e.source !== "portal" ? ` · via ${e.source}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
