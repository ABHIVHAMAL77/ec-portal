# Esports County — Employers Portal

Internal operations & broadcast portal for **Esports County Media & Marketing Solutions Pvt Ltd**.
Track who is working on what, run events with KPIs and to-do lists, log attendance and work,
route staffing requests to Finance, and report on the whole team.

Built with **Next.js + Prisma**. Runs on a local SQLite database in development; switches to
**Supabase (Postgres)** for online hosting with no code changes.

---

## Your logo

Drop your logo image into the `public/` folder as **`public/ec-logo.png`** (PNG, square, ideally
256×256). It appears in the sidebar, the login screen and the browser tab automatically. Until the
file is there, a gold "EC" octagon badge is shown instead.

---

## Run it on your computer

You need [Node.js](https://nodejs.org) 20+.

```bash
npm install
npx prisma generate
npm run db:push     # create the database
npm run db:seed     # departments + one admin account
npm run dev         # start the portal
```

Open **http://localhost:3000** and log in:

- **Email:** `abhiv@esportscounty.com`
- **Password:** `esports123`  *(change it after first login)*

Then go to **Team → Add employee** to onboard everyone else (you can add 20+ people).
For each person you set their department, role, employment type (full-time / part-time /
freelancer) and access level.

### Access levels
- **Admin** — you (the Founder). Sees and controls everything.
- **Full access (COO)** — tick "Full access" when adding someone; they see everything too.
- **Dept. head** — sees and assigns work within their own department.
- **Member** — sees only their own tasks; can log attendance and raise requests.

---

## What's inside

| Module | What it does |
|---|---|
| **Dashboard** | My tasks & KPIs, who's working now, active events |
| **Events** | Founder/COO create events, set **KPIs** and a **to-do list** per event |
| **Tasks** | Kanban board — assign to people/departments with deadlines |
| **Task / event page** | Open a task to **discuss** it and attach **files & links** (Sheets, decks, assets) in a grid |
| **Notifications** | Bell with unread count; company-wide **announcements** everyone sees |
| **Team** | Add & organise employees by department; roles & employment type |
| **Attendance** | Clock in/out; at clock-out you write **what you did + links** |
| **Finance & Requests** | Your hours + work log; raise staffing requests → Finance approves |
| **Reports** | Tasks done, on-time, hours per person; CSV export |
| **Emergency button** | Alerts the Operations department head instantly |

---

## Commands

```bash
npm run dev        # start (development)
npm run db:seed    # clean setup (departments + admin)
npm run db:studio  # visual database browser
npm run db:reset   # wipe + clean setup
npm run build      # production build
```

---

## Going online for the whole team

See **[SETUP-ONLINE.md](./SETUP-ONLINE.md)** — free Supabase database + free Vercel hosting.
For a team of ~20 this comfortably fits the free tiers.
