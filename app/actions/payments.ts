"use server";

import { headers } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { saveUpload } from "@/lib/uploads";
import { sendEmail, emailHtml } from "@/lib/email";
import { notify } from "@/lib/notify";
import { PAYMENT_CATEGORY_LABEL, CURRENCY_SYMBOL } from "@/lib/constants";

// --- Tracking code -----------------------------------------------------------
// Unambiguous alphabet (no 0/O/1/I) so payees can read it off an email.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(): string {
  const bytes = randomBytes(5);
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `EC-PAY-${out}`;
}

async function uniqueTrackingCode(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const code = makeCode();
    const clash = await prisma.paymentRequest.findUnique({ where: { trackingCode: code } });
    if (!clash) return code;
  }
  return `EC-PAY-${Date.now().toString(36).toUpperCase()}`;
}

// --- Anti-spam ---------------------------------------------------------------
async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for"); // set by Nginx on the VPS
    if (fwd) return fwd.split(",")[0]!.trim();
    return h.get("x-real-ip");
  } catch {
    // No request scope (e.g. a script or test) — IP is optional metadata.
    return null;
  }
}

/** Best-effort ISP/org lookup for abuse review. Never blocks a submission. */
async function lookupIsp(ip: string | null): Promise<string | null> {
  if (!ip || ip.startsWith("127.") || ip.startsWith("::1") || ip.startsWith("192.168.")) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const j = (await res.json()) as { org?: string; country_name?: string };
    return [j.org, j.country_name].filter(Boolean).join(" · ") || null;
  } catch {
    return null;
  }
}

const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_IP = 5;
const MAX_PER_EMAIL = 3;

async function rateLimited(ip: string | null, email: string): Promise<string | null> {
  const since = new Date(Date.now() - RATE_WINDOW_MS);
  if (ip) {
    const n = await prisma.paymentRequest.count({ where: { submitIp: ip, createdAt: { gte: since } } });
    if (n >= MAX_PER_IP) return "Too many submissions from this connection. Please try again later.";
  }
  const n2 = await prisma.paymentRequest.count({
    where: { contactEmail: email, createdAt: { gte: since } },
  });
  if (n2 >= MAX_PER_EMAIL) {
    return "You've submitted several requests recently. Please wait a while or contact us directly.";
  }
  return null;
}

// --- Submit ------------------------------------------------------------------
export type SubmitResult = { ok?: true; trackingCode?: string; error?: string };

export async function submitPayment(formData: FormData): Promise<SubmitResult> {
  // Honeypot: real people never fill this hidden field.
  if (String(formData.get("company_website") ?? "").trim() !== "") {
    return { ok: true, trackingCode: "EC-PAY-THANKS" };
  }

  const s = (k: string) => String(formData.get(k) ?? "").trim();

  const payeeName = s("payeeName");
  const contactEmail = s("contactEmail").toLowerCase();
  const contactPhone = s("contactPhone");
  const purpose = s("purpose");
  const amountRaw = s("amount");
  const category = s("category");
  const scope = s("scope") || "domestic";

  if (!payeeName) return { error: "Please enter the name money should be paid to." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail)) return { error: "Please enter a valid email address." };
  if (contactPhone.replace(/\D/g, "").length < 7) {
    return { error: "Please enter a valid phone number, including the country code." };
  }
  if (!category) return { error: "Please choose what this payment is for." };
  if (!purpose) return { error: "Please describe what the payment is for." };

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Please enter a valid amount." };

  if (!formData.get("agreementAccepted")) {
    return { error: "Please accept the agreement to continue." };
  }
  const signerName = s("signerName");
  if (!signerName) return { error: "Please type your name to sign the agreement." };

  const ip = await getClientIp();
  const limited = await rateLimited(ip, contactEmail);
  if (limited) return { error: limited };

  // Save uploaded documents first so a bad file fails before we create the row.
  const fileFields: { field: string; kind: string }[] = [
    { field: "invoiceFile", kind: "invoice" },
    { field: "trcFile", kind: "trc" },
    { field: "form10fFile", kind: "form10f" },
    { field: "noPeFile", kind: "no_pe" },
    { field: "panFile", kind: "pan" },
    { field: "gstFile", kind: "gst" },
    { field: "idProofFile", kind: "id_proof" },
    { field: "bankProofFile", kind: "bank_proof" },
    { field: "agreementFile", kind: "agreement" },
  ];

  const saved: { kind: string; originalName: string; storedName: string; mimeType: string; sizeBytes: number }[] = [];
  try {
    for (const { field, kind } of fileFields) {
      const f = formData.get(field);
      const rec = await saveUpload(f instanceof File ? f : null);
      if (rec) saved.push({ kind, ...rec });
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "One of the files could not be uploaded." };
  }

  if (!saved.some((d) => d.kind === "invoice")) {
    return { error: "Please attach your invoice." };
  }

  const trackingCode = await uniqueTrackingCode();
  const isp = await lookupIsp(ip);

  const request = await prisma.paymentRequest.create({
    data: {
      trackingCode,
      category,
      scope,
      payeeType: s("payeeType") || "individual",
      payeeName,
      contactEmail,
      contactPhone,
      country: s("country") || null,
      addressLine: s("addressLine") || null,
      city: s("city") || null,
      stateRegion: s("stateRegion") || null,
      postalCode: s("postalCode") || null,
      eventRef: s("eventRef") || null,
      purpose,
      amount,
      currency: s("currency") || "INR",
      panOrTin: s("panOrTin") || null,
      gstin: s("gstin") || null,
      taxResidencyCountry: s("taxResidencyCountry") || null,
      form10fInfo: s("form10fInfo") || null,
      noPeDeclared: Boolean(formData.get("noPeDeclared")),
      beneficiaryName: s("beneficiaryName") || null,
      bankName: s("bankName") || null,
      accountNumber: s("accountNumber") || null,
      ifsc: s("ifsc") || null,
      iban: s("iban") || null,
      swiftBic: s("swiftBic") || null,
      bankAddress: s("bankAddress") || null,
      intermediaryBank: s("intermediaryBank") || null,
      agreementAccepted: true,
      agreementAcceptedAt: new Date(),
      signerName,
      submitIp: ip,
      submitIsp: isp,
      status: "submitted",
      documents: { create: saved },
      events: {
        create: { status: "submitted", source: "system", note: "Submitted through the payment portal." },
      },
    },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const money = `${CURRENCY_SYMBOL[request.currency] ?? ""}${amount.toLocaleString("en-IN")} ${request.currency}`;

  // Confirmation to the payee (their tracking code).
  await sendEmail({
    to: contactEmail,
    subject: `We received your payment submission — ${trackingCode}`,
    html: emailHtml(
      `<p>Hi ${payeeName},</p>
       <p>Thanks — we've received your payment submission to <b>Esports County</b>.</p>
       <p style="font-size:20px;font-weight:700;letter-spacing:1px;color:#d6a43e;margin:18px 0">
         ${trackingCode}
       </p>
       <p>Keep this tracking code. You can check your status any time at
       <a href="${appUrl}/track" style="color:#d6a43e">${appUrl}/track</a> using this code and this
       email address.</p>
       <p style="color:#99a2b1;font-size:13px">
         ${PAYMENT_CATEGORY_LABEL[category] ?? category} · ${money}<br/>
         ${purpose}
       </p>
       <p>Our finance team will review it and keep you updated by email.</p>`
    ),
  });

  // Notify Finance head + admins in the staff portal (and by email).
  const financeDept = await prisma.department.findFirst({ where: { slug: "finance" } });
  const recipients = await prisma.profile.findMany({
    where: {
      status: "active",
      OR: [
        { accessLevel: "admin" },
        { fullAccess: true },
        ...(financeDept?.headId ? [{ id: financeDept.headId }] : []),
      ],
    },
    select: { id: true },
  });
  for (const r of recipients) {
    await notify({
      recipientId: r.id,
      type: "payment",
      message: `New payment submission ${trackingCode} — ${payeeName} · ${money}`,
      link: `/payments/${request.id}`,
    });
  }

  return { ok: true, trackingCode };
}
