import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canSeeAll } from "@/lib/access";
import { weekStart } from "@/lib/utils";
import { Card, CardHeader, EmptyState, Stat, Badge } from "@/components/ui";
import { NewManpowerButton, ManpowerRow, type Req } from "@/components/manpower";

function hours(a: Date, b: Date | null) {
  return Math.max(0, ((b ?? new Date()).getTime() - a.getTime()) / 3600000);
}
const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#22c55e",
  rejected: "#ef4444",
};

export default async function FinancePage() {
  const user = await requireUser();
  const financeDept = await prisma.department.findFirst({ where: { slug: "finance" } });
  const canDecide =
    user.accessLevel === "admin" || user.fullAccess === true || financeDept?.headId === user.id;
  const showFullQueue = canDecide || canSeeAll(user);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const ws = weekStart();

  const [myAttendance, myRequests, allRequests, budgets, pendingCount] = await Promise.all([
    prisma.attendance.findMany({ where: { profileId: user.id }, orderBy: { clockIn: "desc" } }),
    prisma.manpowerRequest.findMany({
      where: { requestedById: user.id },
      orderBy: { createdAt: "desc" },
      include: { requestedBy: { select: { fullName: true } }, department: { select: { name: true } } },
    }),
    showFullQueue
      ? prisma.manpowerRequest.findMany({
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          include: { requestedBy: { select: { fullName: true } }, department: { select: { name: true } } },
        })
      : Promise.resolve([]),
    showFullQueue
      ? prisma.budget.findMany({ include: { event: { select: { name: true } } } })
      : Promise.resolve([]),
    showFullQueue ? prisma.manpowerRequest.count({ where: { status: "pending" } }) : Promise.resolve(0),
  ]);

  const hoursToday = myAttendance
    .filter((a) => a.clockIn >= startOfDay)
    .reduce((s, a) => s + hours(a.clockIn, a.clockOut), 0);
  const hoursWeek = myAttendance
    .filter((a) => a.clockIn >= ws)
    .reduce((s, a) => s + hours(a.clockIn, a.clockOut), 0);
  const hoursTotal = myAttendance.reduce((s, a) => s + hours(a.clockIn, a.clockOut), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Finance &amp; Requests</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Your hours worked and any staffing requests you raise.
          </p>
        </div>
        <NewManpowerButton />
      </div>

      {/* My hours — visible to everyone */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">My hours worked</h3>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Today" value={`${hoursToday.toFixed(1)}h`} accent="var(--brand-2)" />
          <Stat label="This week" value={`${hoursWeek.toFixed(1)}h`} />
          <Stat label="All time" value={`${hoursTotal.toFixed(1)}h`} />
        </div>
      </div>

      {/* My work log — what I did each session (from clock-out) */}
      <Card>
        <CardHeader title="My work log" subtitle="What you reported at clock-out" />
        <div className="divide-y divide-[var(--border)]">
          {myAttendance.filter((a) => a.clockOut).length === 0 && (
            <div className="p-5">
              <EmptyState title="No work logged yet" hint="Add a summary when you clock out." />
            </div>
          )}
          {myAttendance
            .filter((a) => a.clockOut)
            .map((a) => (
              <div key={a.id} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {a.clockIn.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </p>
                  <span className="text-xs text-[var(--text-dim)]">{hours(a.clockIn, a.clockOut).toFixed(1)}h</span>
                </div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {a.report || <span className="italic text-[var(--text-dim)]">No summary</span>}
                </p>
                {a.links && (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {a.links
                      .split(/[\s,]+/)
                      .filter(Boolean)
                      .map((l, i) => (
                        <a
                          key={i}
                          href={l}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-full truncate rounded bg-[var(--bg-elev)] px-2 py-0.5 text-xs text-[var(--brand-2)] hover:underline"
                        >
                          {l}
                        </a>
                      ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </Card>

      {/* My requests — visible to everyone */}
      <Card>
        <CardHeader title="My requests" subtitle="Sent to the Finance Manager for approval" />
        <div className="divide-y divide-[var(--border)]">
          {myRequests.length === 0 && (
            <div className="p-5">
              <EmptyState title="No requests yet" hint="Use “Request manpower” above if you need something." />
            </div>
          )}
          {myRequests.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {r.count}× {r.roleNeeded}
                </p>
                {r.reason && <p className="text-xs text-[var(--text-dim)]">{r.reason}</p>}
              </div>
              <Badge color={STATUS_COLOR[r.status]}>{r.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Finance Manager / exec view */}
      {showFullQueue && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Pending requests" value={pendingCount} accent={pendingCount > 0 ? "var(--warning)" : undefined} />
            <Stat label="Budget planned" value={`₹${budgets.reduce((s, b) => s + b.planned, 0).toLocaleString("en-IN")}`} />
            <Stat label="Budget actual" value={`₹${budgets.reduce((s, b) => s + b.actual, 0).toLocaleString("en-IN")}`} accent="var(--brand-2)" />
          </div>

          <Card>
            <CardHeader
              title="All manpower requests"
              subtitle={canDecide ? "Approve or reject as Finance" : "Company-wide (view)"}
            />
            <div className="divide-y divide-[var(--border)]">
              {allRequests.length === 0 && (
                <div className="p-5"><EmptyState title="No manpower requests" /></div>
              )}
              {allRequests.map((r) => (
                <ManpowerRow key={r.id} req={r as unknown as Req} canDecide={canDecide} />
              ))}
            </div>
          </Card>

          {budgets.length > 0 && (
            <Card>
              <CardHeader title="Event budgets" subtitle="Planned vs actual" />
              <div className="divide-y divide-[var(--border)]">
                {budgets.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{b.event.name}</p>
                      <p className="text-xs capitalize text-[var(--text-dim)]">{b.category.replace("_", " ")}</p>
                    </div>
                    <span className="text-sm text-[var(--text-muted)]">
                      ₹{b.actual.toLocaleString("en-IN")} / ₹{b.planned.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
