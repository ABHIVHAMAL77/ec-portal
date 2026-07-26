<div align="center">

<img src="public/ec-logo.png" alt="Esports County" width="110" />

# Esports County — Employers & Payment Portal

**A production web application running the day-to-day operations of an esports
broadcast company — and the money that flows out of it.**

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

🔗 **Live:** [portal.esportscounty.com](https://portal.esportscounty.com)

</div>

---

## What it is

Esports County Media & Marketing runs tournaments, watch-parties and live broadcasts.
This is the internal system that runs the company — built and deployed end to end:

- an **Employers Portal** where the team plans events, assigns work and logs hours, and
- a **public Payment Portal** where vendors, players, influencers and freelancers submit
  invoices with full tax compliance, then track the payment through to a receipt.

Everything lives in one Next.js application, self-hosted on a VPS behind Nginx with HTTPS.

---

## Highlights

| | |
|---|---|
| 🔐 **Custom auth & RBAC** | Cookie sessions with scrypt hashing — no auth library. Four access tiers (Admin, Full-access/COO, Department head, Member) enforced in **both** queries and server actions. |
| 🌍 **Cross-border tax compliance** | Domestic (PAN/GST/IFSC) and international (TRC, Form 10F, No-PE declaration, IBAN/SWIFT) flows so the correct withholding tax can be applied. |
| 📎 **Secure document handling** | Real file uploads stored **outside the web root** and streamed only through a permission-checked route. Never publicly addressable. |
| 🧾 **Audit trail & receipts** | Every status change is recorded as a timeline event. Marking a payment paid auto-issues a numbered, printable receipt. |
| 🛡️ **Anti-abuse** | Honeypot field, per-IP and per-email rate limits, strict MIME/size validation, and IP + ISP capture for review. |
| 🔄 **Two-way Google Sheet sync** | Finance can work in a spreadsheet; editing a status there updates the app and emails the payee, via a secret-protected API + Apps Script. |
| ✉️ **Transactional email** | Pluggable delivery — Google Workspace SMTP or Resend — with branded HTML templates. Degrades gracefully when unconfigured. |

---

## The two surfaces

### Public payment portal — no login

```
/            landing page  (+ a small "Employees" link for staff)
/pay         7-step submission form
/track       status timeline + receipt download
```

A payee picks what the payment is for (vendor, prize pool, influencer, salary, freelancer,
event cost, reimbursement), enters their details, uploads their invoice and tax documents,
provides bank details, and signs a click-wrap agreement — their name, timestamp and IP are
stored as proof of acceptance.

They receive a **tracking code** (`EC-PAY-7GK2Q`) by email. `/track` requires **both** the
code and the submitting email, and never exposes bank or tax data.

### Staff portal — authenticated

```
/dashboard   my tasks, KPIs, who's working now
/events      events with KPIs and per-event to-do lists
/tasks       kanban board, per-task discussion + file links
/payments    finance dashboard  (Founder / COO / Finance head only)
/attendance  clock in-out, with a work report captured at clock-out
/people      team directory, onboarding, roles
/reports     performance + hours, CSV export
```

The **finance dashboard** shows KPI tiles (totals grouped per currency — never summed
across them), filters, search and CSV export. Each submission opens to the full record:
documents, tax data, bank details, agreement proof, submitter IP/ISP and status history —
with a review panel to approve, hold, reject or mark paid.

---

## Architecture

```
Next.js 16 App Router
├── app/                    routes — public (/, /pay, /track) + (app) group for staff
│   ├── actions/            server actions: all mutations live here
│   └── api/                document streaming + Google Sheet sync endpoints
├── components/             UI primitives and feature components
├── lib/
│   ├── auth.ts             scrypt password hashing + cookie sessions
│   ├── access.ts           role predicates and Prisma visibility filters
│   ├── uploads.ts          validated file storage outside the web root
│   ├── notify.ts           in-app notification + email in one call
│   └── email.ts            SMTP or Resend, whichever is configured
└── prisma/schema.prisma    ~20 models
```

**Design decisions worth noting**

- **Server actions over API routes** for mutations — validation and authorisation live next
  to the write, so the UI is never the only thing enforcing a rule.
- **Access control as data filters.** `taskWhere(user)` / `eventWhere(user)` return Prisma
  `where` clauses, so scoping is applied in the query rather than filtered in the view.
- **String status fields + typed constants** instead of database enums, keeping the schema
  portable between SQLite (development) and Postgres (production).
- **Cache revalidation is failure-tolerant**, so a sheet-driven update — which runs outside a
  request scope — can reuse exactly the same code path as a click in the UI.

---

## Running locally

```bash
npm install
npx prisma generate
npm run db:push      # create the database
npm run db:seed      # departments + one admin account
npm run dev
```

Open <http://localhost:3000>. Sign in at `/login` with the seeded admin, then add your team
from **Team → Add employee**.

| Script | |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build |
| `npm run db:seed` | clean setup — 9 departments + admin |
| `npm run db:reset` | wipe and re-seed |
| `npm run db:studio` | browse the database |

### Configuration

`.env` — only `DATABASE_URL` is required; email and sheet sync stay switched off until
configured:

```ini
DATABASE_URL="file:./dev.db"
SESSION_SECRET="a-long-random-string"
APP_URL="http://localhost:3000"

UPLOAD_DIR=""              # defaults to ./uploads locally
SMTP_USER=""               # Google Workspace address
SMTP_PASS=""               # app password
RESEND_API_KEY=""          # alternative to SMTP
SHEET_SYNC_SECRET=""       # enables /api/sheet/*
```

---

## Deployment

Self-hosted on an Ubuntu VPS: **Nginx** reverse proxy → **PM2** → Next.js, with a free
Let's Encrypt certificate and auto-renewal. Uploaded documents live in
`/var/www/portal-data/uploads`, outside the deploy directory, so they survive every release.

See **[DEPLOY-VPS.md](DEPLOY-VPS.md)** for first-time setup and **[PAYMENT-PORTAL.md](PAYMENT-PORTAL.md)**
for how the payment flow and Google Sheet sync work.

---

## Notes

The agreement text in `lib/agreement.ts` and the tax wording on the form are professional
templates written against Indian withholding-tax practice — they are not legal advice and
should be reviewed by a qualified advisor before use.

No money moves through this application. It collects and verifies the paperwork; payments
are released by the finance team through the company's own bank and recorded here.

<div align="center">

Built with Next.js, TypeScript and Prisma · © Esports County Media &amp; Marketing Solutions Pvt Ltd

</div>
