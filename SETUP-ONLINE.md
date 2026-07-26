# Putting the portal online (for the whole team)

This guide takes the portal from your computer to a real website your team can log into from
anywhere. For a team **under 15 people this stays on free tiers** (≈ ₹0/month to start).

You'll use two free services:

- **Supabase** — the online database (replaces the local file database).
- **Vercel** — the hosting (gives you a web address like `esports-county.vercel.app`).

---

## Step 1 — Create the online database (Supabase)

1. Go to **https://supabase.com** and sign up (free).
2. Click **New project**. Give it a name (e.g. `esports-county`) and set a database password
   (save it somewhere safe).
3. Once created, open **Project Settings → Database → Connection string → URI**.
4. Copy that connection string. It looks like:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`

## Step 2 — Point the portal at Supabase

1. In `prisma/schema.prisma`, change the database provider from SQLite to Postgres:

   ```prisma
   datasource db {
     provider = "postgresql"   // was "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. In your `.env` file, replace `DATABASE_URL` with the Supabase connection string from Step 1.

3. Create the tables in Supabase and add your team:

   ```bash
   npm run db:push
   npm run db:seed
   ```

## Step 3 — Host it (Vercel)

1. Push this project to a **GitHub** repository (ask your developer, or use GitHub Desktop).
2. Go to **https://vercel.com**, sign up, and click **Add New → Project**.
3. Import your GitHub repository.
4. Under **Environment Variables**, add:
   - `DATABASE_URL` = your Supabase connection string
   - `SESSION_SECRET` = any long random text
5. Click **Deploy**. In a minute you'll get a live web address.

## Step 4 — Use your own web address (optional)

In Vercel → your project → **Settings → Domains**, add `portal.esportscounty.com`
(you'll add one DNS record at your domain provider — Vercel shows you exactly what).

---

## After go-live — important

- **Log in as admin** (`abhiv@esportscounty.com` / `esports123`) and **change your password**.
- **Add your team** in **Team → Add employee** — set each person's department, role, employment
  type and access level, and give them a temporary password to change on first login.
- **Add your logo**: put your logo image at `public/ec-logo.png` before deploying.
- **Back up** — Supabase backups are automatic on paid tiers; export periodically on free.

---

## Turn on email notifications

The portal already sends an email for every notification (task assigned, KPI, comment,
manpower, emergency, announcement) — it just needs credentials. Pick one option.

### Option 1 — Google Workspace (recommended; you already have it)

Send from a dedicated `notifications@esportscounty.com` Google account. No new service, no DNS changes.

1. In **Google Admin** (admin.google.com) create the user **notifications@esportscounty.com**
   (or add it as an alias — a real user is simplest for sending).
2. Sign in to that account once, then turn on **2-Step Verification**:
   [myaccount.google.com/security](https://myaccount.google.com/security).
3. Create an **App Password** for it:
   [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   → name it "Esports County Portal" → copy the 16-character password.
4. Set these environment variables (in `.env` locally, and in Vercel → Settings → Env Vars):
   - `SMTP_USER` = `notifications@esportscounty.com`
   - `SMTP_PASS` = the 16-character App Password
   - `EMAIL_FROM` = `Esports County <notifications@esportscounty.com>`
   - `APP_URL` = your live URL (e.g. `https://portal.esportscounty.com`)

That's it. (Google Workspace allows ~2,000 emails/day — plenty for the team.)

### Option 2 — Resend (alternative)

1. Sign up at [resend.com](https://resend.com) (free, 3,000/mo) → add domain `esportscounty.com`
   (add the DNS records it shows) → **API Keys → Create**.
2. Set `RESEND_API_KEY` and `EMAIL_FROM`. Used only when SMTP is left blank.

Leaving both blank keeps the portal on in-app notifications only.

---

## What's next (optional)

- **WhatsApp / Discord notifications** — mirror alerts to WhatsApp (needs a paid WhatsApp
  Business API provider) or a Discord server.
- **Automated deadline reminders** — a scheduled job that emails overdue tasks each morning.
