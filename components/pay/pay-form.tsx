"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Upload, AlertCircle, FileSpreadsheet } from "lucide-react";
import { submitPayment } from "@/app/actions/payments";
import {
  PAYMENT_CATEGORIES,
  PAYMENT_CATEGORY_LABEL,
  PAYMENT_CATEGORY_HINT,
  PAYMENT_SCOPES,
  PAYMENT_SCOPE_LABEL,
  PAYEE_TYPES,
  PAYEE_TYPE_LABEL,
  PAYMENT_CURRENCIES,
} from "@/lib/constants";
import { AGREEMENT_TEXT } from "@/lib/agreement";

const STEPS = ["Type", "Your details", "Payment", "Tax", "Bank", "Agreement", "Review"];

const input =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2.5 text-sm outline-none focus:border-[var(--brand)]";
const label = "mb-1 block text-xs font-medium text-[var(--text-muted)]";

function Field({
  name,
  labelText,
  hint,
  required,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  name: string;
  labelText: string;
  hint?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={label}>
        {labelText} {required && <span className="text-[var(--brand)]">*</span>}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={input}
      />
      {hint && <p className="mt-1 text-[11px] text-[var(--text-dim)]">{hint}</p>}
    </div>
  );
}

const MAX_FILE_BYTES = 10 * 1024 * 1024; // per file
const MAX_TOTAL_BYTES = 28 * 1024 * 1024; // all files in one submission

function mb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FileField({
  name,
  labelText,
  hint,
  required,
  file,
  onFile,
}: {
  name: string;
  labelText: string;
  hint?: string;
  required?: boolean;
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  return (
    <div>
      <label className={label}>
        {labelText} {required && <span className="text-[var(--brand)]">*</span>}
      </label>
      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2.5 text-sm hover:border-[var(--brand)]">
        <Upload size={15} className="shrink-0 text-[var(--text-dim)]" />
        <span className={file ? "truncate text-[var(--text)]" : "text-[var(--text-dim)]"}>
          {file ? `${file.name} · ${mb(file.size)}` : "Choose a PDF or image (max 10 MB)"}
        </span>
        <input
          type="file"
          name={name}
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {hint && <p className="mt-1 text-[11px] text-[var(--text-dim)]">{hint}</p>}
    </div>
  );
}

export function PayForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // text fields
  const [f, setF] = useState<Record<string, string>>({
    category: "",
    scope: "domestic",
    payeeType: "individual",
    payeeName: "",
    contactEmail: "",
    contactPhone: "",
    country: "India",
    addressLine: "",
    city: "",
    stateRegion: "",
    postalCode: "",
    eventRef: "",
    purpose: "",
    amount: "",
    currency: "INR",
    panOrTin: "",
    gstin: "",
    taxResidencyCountry: "",
    form10fInfo: "",
    beneficiaryName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    iban: "",
    swiftBic: "",
    bankAddress: "",
    intermediaryBank: "",
    signerName: "",
    company_website: "", // honeypot
  });
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  // files
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const setFile = (k: string) => (file: File | null) => {
    if (file && file.size > MAX_FILE_BYTES) {
      setError(`"${file.name}" is ${mb(file.size)} — each file must be under 10 MB.`);
      return;
    }
    setError(null);
    setFiles((p) => ({ ...p, [k]: file }));
  };

  const [noPe, setNoPe] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const intl = f.scope === "international";

  function validateStep(i: number): string | null {
    if (i === 0 && !f.category) return "Please choose what this payment is for.";
    if (i === 1) {
      if (!f.payeeName.trim()) return "Please enter the name money should be paid to.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.contactEmail)) return "Please enter a valid email address.";
      if (f.contactPhone.replace(/\D/g, "").length < 7) {
        return "Please enter a valid phone number, including the country code.";
      }
    }
    if (i === 2) {
      if (!f.purpose.trim()) return "Please describe what this payment is for.";
      if (!(Number(f.amount) > 0)) return "Please enter a valid amount.";
      if (!files.invoiceFile) return "Please attach your invoice.";
    }
    if (i === 3) {
      if (!intl && !f.panOrTin.trim()) return "PAN is required for payments within India.";
      if (intl && !f.taxResidencyCountry.trim()) return "Please enter your country of tax residence.";
      if (intl && !files.trcFile) return "A Tax Residence Certificate (TRC) is required for international payments.";
    }
    if (i === 4) {
      if (!f.beneficiaryName.trim()) return "Please enter the bank account holder's name.";
      if (!f.bankName.trim()) return "Please enter your bank's name.";
      if (intl) {
        if (!f.iban.trim() && !f.accountNumber.trim()) return "Please enter your IBAN or account number.";
        if (!f.swiftBic.trim()) return "SWIFT/BIC is required for international transfers.";
      } else {
        if (!f.accountNumber.trim()) return "Please enter your account number.";
        if (!f.ifsc.trim()) return "IFSC code is required for Indian bank accounts.";
      }
    }
    if (i === 5) {
      if (!agreed) return "Please accept the agreement to continue.";
      if (!f.signerName.trim()) return "Please type your full name to sign.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) return setError(err);
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    for (let i = 0; i <= 5; i++) {
      const err = validateStep(i);
      if (err) {
        setStep(i);
        return setError(err);
      }
    }

    const attached = Object.values(files).filter(Boolean) as File[];
    const total = attached.reduce((n, file) => n + file.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      return setError(
        `Your documents add up to ${mb(total)}, which is over the ${mb(MAX_TOTAL_BYTES)} limit. ` +
          `Please compress them or remove any optional files, then try again.`
      );
    }

    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => fd.set(k, v));
    Object.entries(files).forEach(([k, file]) => file && fd.set(k, file));
    if (noPe) fd.set("noPeDeclared", "on");
    fd.set("agreementAccepted", "on");

    start(async () => {
      setError(null);
      try {
        const res = await submitPayment(fd);
        if (res?.error) setError(res.error);
        else if (res?.trackingCode) {
          router.push(`/pay/success?code=${encodeURIComponent(res.trackingCode)}`);
        }
      } catch {
        // Usually a stale page after a deployment (the server action id changed),
        // or the connection dropped mid-upload. Neither is the payee's fault.
        setError(
          "We couldn't submit that — the page may be out of date, or the upload was interrupted. " +
            "Please refresh this page and try again. Your details will need re-entering, sorry."
        );
      }
    });
  }

  return (
    <div>
      {/* Stepper */}
      <ol className="mb-6 flex flex-wrap gap-x-2 gap-y-1 text-xs">
        {STEPS.map((name, i) => (
          <li key={name} className="flex items-center gap-1.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                i < step
                  ? "bg-[var(--success)] text-white"
                  : i === step
                  ? "bg-[var(--brand)] text-[#17130a]"
                  : "bg-[var(--bg-hover)] text-[var(--text-dim)]"
              }`}
            >
              {i < step ? <Check size={11} /> : i + 1}
            </span>
            <span className={i === step ? "font-medium text-[var(--text)]" : "text-[var(--text-dim)]"}>
              {name}
            </span>
            {i < STEPS.length - 1 && <span className="text-[var(--text-dim)]">›</span>}
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 md:p-6">
        {/* honeypot */}
        <input
          type="text"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          value={f.company_website}
          onChange={(e) => set("company_website")(e.target.value)}
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          aria-hidden
        />

        {/* Step 0 — type */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold">What is this payment for?</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PAYMENT_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("category")(c)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      f.category === c
                        ? "border-[var(--brand)] bg-[var(--brand)]/10"
                        : "border-[var(--border)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <div className="text-sm font-medium">{PAYMENT_CATEGORY_LABEL[c]}</div>
                    <div className="mt-0.5 text-[11px] text-[var(--text-dim)]">
                      {PAYMENT_CATEGORY_HINT[c]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Where is your bank account?</label>
                <div className="flex gap-2">
                  {PAYMENT_SCOPES.map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => set("scope")(sc)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                        f.scope === sc
                          ? "border-[var(--brand)] bg-[var(--brand)]/10"
                          : "border-[var(--border)] text-[var(--text-muted)]"
                      }`}
                    >
                      {PAYMENT_SCOPE_LABEL[sc]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={label}>Are you paid as</label>
                <div className="flex gap-2">
                  {PAYEE_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("payeeType")(t)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                        f.payeeType === t
                          ? "border-[var(--brand)] bg-[var(--brand)]/10"
                          : "border-[var(--border)] text-[var(--text-muted)]"
                      }`}
                    >
                      {PAYEE_TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — payee */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Your details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="payeeName"
                labelText={f.payeeType === "company" ? "Company / firm name" : "Full name"}
                required
                value={f.payeeName}
                onChange={set("payeeName")}
                placeholder={f.payeeType === "company" ? "Acme Productions Pvt Ltd" : "Your full name"}
              />
              <Field
                name="contactEmail"
                labelText="Email address"
                required
                type="email"
                hint="All updates and your receipt go here."
                value={f.contactEmail}
                onChange={set("contactEmail")}
                placeholder="you@example.com"
              />
              <Field
                name="contactPhone"
                labelText="Phone number"
                required
                hint="Include the country code, e.g. +91 98765 43210."
                value={f.contactPhone}
                onChange={set("contactPhone")}
                placeholder="+91 98765 43210"
              />
              <Field name="country" labelText="Country" value={f.country} onChange={set("country")} />
              <div className="sm:col-span-2">
                <Field
                  name="addressLine"
                  labelText="Address"
                  value={f.addressLine}
                  onChange={set("addressLine")}
                  placeholder="Street address"
                />
              </div>
              <Field name="city" labelText="City" value={f.city} onChange={set("city")} />
              <div className="grid grid-cols-2 gap-3">
                <Field name="stateRegion" labelText="State" value={f.stateRegion} onChange={set("stateRegion")} />
                <Field name="postalCode" labelText="PIN / ZIP" value={f.postalCode} onChange={set("postalCode")} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — payment */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Payment details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="eventRef"
                labelText="Event / reference (optional)"
                hint="e.g. PMNC SA Fall 2026"
                value={f.eventRef}
                onChange={set("eventRef")}
              />
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <Field
                  name="amount"
                  labelText="Amount"
                  required
                  type="number"
                  value={f.amount}
                  onChange={set("amount")}
                  placeholder="0.00"
                />
                <div>
                  <label className={label}>Currency</label>
                  <select
                    name="currency"
                    value={f.currency}
                    onChange={(e) => set("currency")(e.target.value)}
                    className={input}
                  >
                    {PAYMENT_CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>
                  What is this payment for? <span className="text-[var(--brand)]">*</span>
                </label>
                <textarea
                  name="purpose"
                  rows={3}
                  value={f.purpose}
                  onChange={(e) => set("purpose")(e.target.value)}
                  placeholder="Describe the work, goods or service this invoice covers."
                  className={input}
                />
              </div>
              <div className="sm:col-span-2">
                <FileField
                  name="invoiceFile"
                  labelText="Invoice"
                  required
                  hint="Your invoice as a PDF or clear photo/scan."
                  file={files.invoiceFile ?? null}
                  onFile={setFile("invoiceFile")}
                />
                <a
                  href="/esports-county-invoice-template.xlsx"
                  download
                  className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--brand)] hover:text-[var(--text)]"
                >
                  <FileSpreadsheet size={14} className="text-[var(--brand)]" />
                  Don&apos;t have an invoice? Download our template (Excel)
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — tax */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Tax &amp; compliance</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {intl
                ? "For cross-border payments we must apply the correct withholding tax. These documents let us apply treaty rates where they exist."
                : "Required so we can deduct and report TDS correctly."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="panOrTin"
                labelText={intl ? "Tax ID / TIN" : "PAN"}
                required={!intl}
                value={f.panOrTin}
                onChange={set("panOrTin")}
                placeholder={intl ? "Your tax identification number" : "ABCDE1234F"}
              />
              {!intl && (
                <Field
                  name="gstin"
                  labelText="GSTIN (if registered)"
                  value={f.gstin}
                  onChange={set("gstin")}
                />
              )}
              {intl && (
                <Field
                  name="taxResidencyCountry"
                  labelText="Country of tax residence"
                  required
                  value={f.taxResidencyCountry}
                  onChange={set("taxResidencyCountry")}
                />
              )}
              <FileField
                name="panFile"
                labelText={intl ? "Tax ID document" : "PAN card copy"}
                file={files.panFile ?? null}
                onFile={setFile("panFile")}
              />
              {!intl && (
                <FileField
                  name="gstFile"
                  labelText="GST certificate (optional)"
                  file={files.gstFile ?? null}
                  onFile={setFile("gstFile")}
                />
              )}
              {intl && (
                <>
                  <FileField
                    name="trcFile"
                    labelText="Tax Residence Certificate (TRC)"
                    required
                    hint="Issued by your country's tax authority for the current year."
                    file={files.trcFile ?? null}
                    onFile={setFile("trcFile")}
                  />
                  <div className="sm:col-span-2">
                    <label className={label}>Form 10F details</label>
                    <textarea
                      name="form10fInfo"
                      rows={2}
                      value={f.form10fInfo}
                      onChange={(e) => set("form10fInfo")(e.target.value)}
                      placeholder="Status (individual/company), nationality, tax ID, address and period of residence."
                      className={input}
                    />
                  </div>
                  <FileField
                    name="form10fFile"
                    labelText="Form 10F (signed)"
                    file={files.form10fFile ?? null}
                    onFile={setFile("form10fFile")}
                  />
                  <FileField
                    name="noPeFile"
                    labelText="No-PE declaration (if you have one)"
                    file={files.noPeFile ?? null}
                    onFile={setFile("noPeFile")}
                  />
                  <div className="sm:col-span-2">
                    <label className="flex items-start gap-2.5 rounded-lg bg-[var(--bg-elev)] px-3 py-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={noPe}
                        onChange={(e) => setNoPe(e.target.checked)}
                        className="mt-0.5 accent-[var(--brand)]"
                      />
                      <span>
                        I declare that I do <b>not</b> have a Permanent Establishment or fixed base in
                        India in respect of this payment.
                      </span>
                    </label>
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <FileField
                  name="idProofFile"
                  labelText={f.payeeType === "company" ? "Company registration proof" : "Photo ID (optional)"}
                  file={files.idProofFile ?? null}
                  onFile={setFile("idProofFile")}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — bank */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Bank details</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Please double-check these — payments are sent exactly as entered.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="beneficiaryName"
                labelText="Account holder name"
                required
                hint="Exactly as it appears on the bank account."
                value={f.beneficiaryName}
                onChange={set("beneficiaryName")}
              />
              <Field name="bankName" labelText="Bank name" required value={f.bankName} onChange={set("bankName")} />
              {intl ? (
                <>
                  <Field name="iban" labelText="IBAN" value={f.iban} onChange={set("iban")} hint="If your country uses IBAN." />
                  <Field
                    name="accountNumber"
                    labelText="Account number"
                    value={f.accountNumber}
                    onChange={set("accountNumber")}
                    hint="If you don't have an IBAN."
                  />
                  <Field name="swiftBic" labelText="SWIFT / BIC" required value={f.swiftBic} onChange={set("swiftBic")} />
                  <Field
                    name="intermediaryBank"
                    labelText="Intermediary bank (optional)"
                    value={f.intermediaryBank}
                    onChange={set("intermediaryBank")}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      name="bankAddress"
                      labelText="Bank branch address"
                      value={f.bankAddress}
                      onChange={set("bankAddress")}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Field
                    name="accountNumber"
                    labelText="Account number"
                    required
                    value={f.accountNumber}
                    onChange={set("accountNumber")}
                  />
                  <Field
                    name="ifsc"
                    labelText="IFSC code"
                    required
                    value={f.ifsc}
                    onChange={set("ifsc")}
                    placeholder="HDFC0001234"
                  />
                  <div className="sm:col-span-2">
                    <Field name="bankAddress" labelText="Branch (optional)" value={f.bankAddress} onChange={set("bankAddress")} />
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <FileField
                  name="bankProofFile"
                  labelText="Bank proof (optional)"
                  hint="Cancelled cheque, passbook or bank statement header."
                  file={files.bankProofFile ?? null}
                  onFile={setFile("bankProofFile")}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — agreement */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Agreement</h2>
            <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-4 text-[13px] leading-relaxed text-[var(--text-muted)]">
              {AGREEMENT_TEXT}
            </div>
            <label className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-[var(--brand)]"
              />
              <span>
                I have read and accept the terms above, and confirm that all information and documents
                I have provided are true and correct.
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="signerName"
                labelText="Type your full name to sign"
                required
                value={f.signerName}
                onChange={set("signerName")}
              />
              <FileField
                name="agreementFile"
                labelText="Signed agreement (optional)"
                hint="Only if you were sent a separate contract to sign."
                file={files.agreementFile ?? null}
                onFile={setFile("agreementFile")}
              />
            </div>
          </div>
        )}

        {/* Step 6 — review */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Review &amp; submit</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {[
                ["Payment for", PAYMENT_CATEGORY_LABEL[f.category] ?? "—"],
                ["Type", `${PAYMENT_SCOPE_LABEL[f.scope]} · ${PAYEE_TYPE_LABEL[f.payeeType]}`],
                ["Paid to", f.payeeName],
                ["Email", f.contactEmail],
                ["Amount", `${f.amount} ${f.currency}`],
                ["Event / ref", f.eventRef || "—"],
                ["Bank", `${f.bankName} · ${intl ? f.iban || f.accountNumber : f.accountNumber}`],
                [intl ? "SWIFT/BIC" : "IFSC", intl ? f.swiftBic : f.ifsc],
                ["Signed by", f.signerName],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-[var(--border)] py-1.5">
                  <dt className="text-[var(--text-dim)]">{k}</dt>
                  <dd className="truncate text-right font-medium">{v || "—"}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Attached documents</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(files)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <span key={k} className="rounded-md bg-[var(--bg-elev)] px-2 py-1 text-xs text-[var(--text-muted)]">
                      {v!.name}
                    </span>
                  ))}
              </div>
            </div>
            <p className="text-xs text-[var(--text-dim)]">
              After submitting you&apos;ll get a tracking code by email to follow your payment status.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2.5 text-sm text-[var(--danger)]">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={back}
            disabled={step === 0 || pending}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-[#17130a] hover:bg-[var(--brand-2)]"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-[#17130a] hover:bg-[var(--brand-2)] disabled:opacity-50"
            >
              {pending ? "Submitting…" : "Submit payment request"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
