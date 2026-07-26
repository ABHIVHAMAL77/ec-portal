// Email delivery. Two options, whichever is configured (SMTP wins):
//   1. Gmail / Google Workspace SMTP  (SMTP_USER + SMTP_PASS app password)
//   2. Resend HTTP API                (RESEND_API_KEY)
// If neither is set, this is a no-op so the app works without email.
import nodemailer from "nodemailer";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

async function sendViaSmtp(from: string, opts: { to: string; subject: string; html: string }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
}

async function sendViaResend(from: string, opts: { to: string; subject: string; html: string }) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
  });
  if (!res.ok) console.error("Resend error:", res.status, await res.text());
}

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const from =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `Esports County <${process.env.SMTP_USER}>`
      : "Esports County <onboarding@resend.dev>");

  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendViaSmtp(from, opts);
    } else if (process.env.RESEND_API_KEY) {
      await sendViaResend(from, opts);
    }
    // else: email disabled — no-op
  } catch (err) {
    // Never let an email failure break the app action.
    console.error("sendEmail failed:", err);
  }
}

const APP_URL = process.env.APP_URL || "http://localhost:3000";

// Branded email shell (gold/charcoal to match the portal).
export function emailHtml(message: string, link?: string | null): string {
  const button = link
    ? `<a href="${APP_URL}${link}" style="display:inline-block;margin-top:16px;background:#d6a43e;color:#17130a;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">Open the portal</a>`
    : "";
  return `
  <div style="background:#0a0c10;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#14181f;border:1px solid #2a2f39;border-radius:14px;overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid #2a2f39;color:#eaedf3;font-weight:700;letter-spacing:1px">
        ESPORTS&nbsp;COUNTY <span style="color:#8b95ad;font-weight:400">· Employers Portal</span>
      </div>
      <div style="padding:24px;color:#eaedf3;font-size:15px;line-height:1.6">
        ${message}
        ${button}
      </div>
      <div style="padding:16px 24px;border-top:1px solid #2a2f39;color:#646d7e;font-size:12px">
        You're receiving this because you're on the Esports County team.
      </div>
    </div>
  </div>`;
}
