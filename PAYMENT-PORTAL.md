# Payment Portal — how it works

The site now has **two sides**:

| Who | Where | Login? |
|---|---|---|
| **Vendors, players, influencers, freelancers, staff** | `/` → `/pay` → `/track` | No |
| **Your team** | `/login` → the Employers Portal | Yes |

> **Important:** no money moves through this website. Payees submit their details; your
> finance team reviews and pays from your own bank, then records it here. The portal keeps
> the paperwork, the audit trail and the receipts.

---

## For payees (public)

1. **`/`** — landing page, with a big *Make a payment submission* button and a small
   **Employees** link for your staff.
2. **`/pay`** — a 7-step form:
   Type → Your details → Payment → Tax → Bank → Agreement → Review.
   - Contact is **just their email**.
   - **Domestic** asks for PAN + IFSC; **international** asks for TRC, Form 10F, No-PE
     declaration, IBAN/SWIFT and intermediary bank.
   - Invoice upload is required. Files may be PDF/JPG/PNG/WEBP up to 10 MB.
   - They accept the agreement by ticking the box and typing their name (their name, the
     time and their IP are recorded as proof).
3. **Tracking code** — e.g. `EC-PAY-7GK2Q`, shown on screen and emailed.
4. **`/track`** — they enter the **code + the email they used** to see the progress
   timeline, and once you mark it paid, to **download their receipt**.

**Anti-spam:** a hidden honeypot field, per-IP (5/hour) and per-email (3/hour) limits, strict
file checks, and the submitter's IP + ISP are recorded for review.

---

## For your finance team (staff portal)

Visible **only** to the Founder (admin), the COO (full access) and the **Finance department
head** — nobody else can see payments or open the documents.

- **Payments** in the sidebar → dashboard with pending / approved / paid-this-month tiles
  (totals shown per currency), search, status and type filters, and **Export CSV**.
- Open a submission to see everything: details, tax & compliance, bank details, all uploaded
  **documents** (secure download), agreement proof, submitter IP/ISP, and a **history timeline**.
- **Review panel** — set the status (submitted / under review / approved / on hold / rejected /
  paid), add a note the payee will see, and record the bank transaction reference.
- Marking **paid** automatically issues a **receipt number**, emails the payee, and makes the
  receipt downloadable on their tracking page. `Payments → open → Receipt` prints it as PDF.

Every status change emails the payee and is written to the timeline.

---

## Google Sheet sync (two-way)

Statuses can be managed from a Google Sheet as well as the portal.

**Set up once (about 5 minutes):**

1. On the server, put a long random value in `.env`:
   ```
   SHEET_SYNC_SECRET="a-long-random-string"
   ```
   then run `bash update.sh` to restart.
2. Create a Google Sheet, e.g. *Esports County — Payments*.
3. **Extensions → Apps Script**, paste the contents of **`docs/apps-script.gs`**.
4. In that script set `PORTAL_URL` and paste the same `SECRET`.
5. Run `pullFromPortal` once (approve the permission prompt).
6. Add two triggers: `pullFromPortal` on a 5-minute timer, and `onSheetEdit` on edit.

**Then:**
- New submissions appear in the sheet automatically.
- Changing the **status** cell in the sheet updates the portal, records it in the timeline as
  *via sheet*, and emails the payee — exactly like a change made in the portal.

Valid statuses: `submitted`, `under_review`, `approved`, `on_hold`, `rejected`, `paid`.

---

## Files, backups & security

- Uploaded documents are stored at **`/var/www/portal-data/uploads`** — outside the app folder,
  so they survive every deploy — and are **never** served publicly. They can only be opened
  through a login-checked route.
- Public pages reveal nothing sensitive: `/track` and the receipt need **both** the tracking
  code and the matching email, and never show bank or tax details.
- **Back up both** of these regularly:
  ```bash
  cp /var/www/portal/prisma/prod.db ~/portal-db-$(date +%F).db
  tar -czf ~/portal-uploads-$(date +%F).tar.gz -C /var/www/portal-data uploads
  ```

## Before going live

- Have your **CA / legal advisor review the agreement text** in `lib/agreement.ts` and the tax
  wording on the form — they're a professional starting template, not legal advice.
- Make sure the Finance department has a **head assigned** (Team → edit → "head of department"),
  otherwise payment notifications fall back to admins only.
