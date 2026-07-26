@AGENTS.md

# Esports County — Employers Portal

Internal operations & broadcast portal for Esports County Media & Marketing (an esports
tournament/broadcast company). Mirrors the real company workflow — see the approved plan at
`C:\Users\Worka\.claude\plans\i-have-a-business-synthetic-volcano.md`.

## Stack
- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind v4** (CSS-based theme in `app/globals.css`; brand tokens as CSS vars)
- **Prisma 6** ORM. Dev DB = **SQLite** (`prisma/dev.db`). Prod = **Supabase Postgres**
  (change `provider` in `prisma/schema.prisma`, see `SETUP-ONLINE.md`).
- Custom cookie-session auth in `lib/auth.ts` (scrypt hashing, `Session` table). No external auth lib.

## Key conventions
- Server Components fetch via `prisma` (`lib/db.ts`); mutations are **server actions** in `app/actions/*`.
- Allowed values for String status fields + labels/colors live in `lib/constants.ts` (SQLite has no enums).
- Shared UI primitives in `components/ui.tsx`; brand colors via `var(--brand)`, `var(--bg-card)`, etc.
- Authenticated pages live under `app/(app)/` (route group; layout enforces `requireUser()`).
- Login at `app/login`; `getCurrentUser()` / `requireUser()` / `requireAdmin()` guard access.

## Commands
- `npm run dev` — start (port 3000)
- `npm run db:seed` — CLEAN setup: 9 departments + 1 admin (`abhiv@esportscounty.com` / `esports123`)
- `npm run db:reset` — wipe + clean setup
- After editing `prisma/schema.prisma`: stop dev server first (it locks the engine DLL on Windows),
  then `npx prisma db push && npx prisma generate`, then restart.

## Domain notes
- **No pitch/approval.** Founder/COO create events directly (stage starts `planning`) and set
  **KPIs** (`Kpi` model) + a per-event **to-do list** (tasks). Lifecycle: planning → live → post_review → closed.
- **Access** (`lib/access.ts`): admins + anyone with `fullAccess` (COO) see everything;
  dept heads see their department; members see only their own work. Enforced in queries AND actions.
- Admin onboards people via **Team → Add employee** (`app/actions/people.ts`); people with no
  department appear under "Unassigned".
- Manpower requests route to the **Finance department head** (fallback admin); emergencies alert the
  **Operations department head**. Routing uses `department.headId`, not hardcoded job titles.
- Branding: gold/charcoal theme in `globals.css`; logo image at `public/ec-logo.png` with an
  octagon "EC" fallback (`components/logo.tsx`).
