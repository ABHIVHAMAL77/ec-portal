import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Card, CardHeader, Avatar, Badge, EmptyState, Stat } from "@/components/ui";
import { ClockToggle } from "@/components/clock-toggle";
import { LocalTime, LocalTimezone } from "@/components/local-time";

function hoursBetween(a: Date, b: Date) {
  return Math.max(0, (b.getTime() - a.getTime()) / 3600000);
}

export default async function AttendancePage() {
  const user = await requireUser();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [myOpen, todays, workingNow] = await Promise.all([
    prisma.attendance.findFirst({ where: { profileId: user.id, clockOut: null } }),
    prisma.attendance.findMany({
      where: { clockIn: { gte: startOfDay } },
      include: { profile: true },
      orderBy: { clockIn: "desc" },
    }),
    prisma.attendance.count({ where: { clockOut: null } }),
  ]);

  const totalHoursToday = todays.reduce(
    (sum, a) => sum + hoursBetween(a.clockIn, a.clockOut ?? new Date()),
    0
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Attendance</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Clock in when you start working today. Times shown in your timezone
            (<LocalTimezone />).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {myOpen && (
            <span className="text-sm text-[var(--success)]">
              ● Clocked in at <LocalTime iso={myOpen.clockIn.toISOString()} mode="time" />
            </span>
          )}
          <ClockToggle isIn={!!myOpen} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Working now" value={workingNow} accent="var(--success)" />
        <Stat label="Sessions today" value={todays.length} />
        <Stat label="Team hours today" value={totalHoursToday.toFixed(1)} accent="var(--brand-2)" />
      </div>

      <Card>
        <CardHeader title="Today's log" subtitle="Clock-in / clock-out per person" />
        <div className="divide-y divide-[var(--border)]">
          {todays.length === 0 && <div className="p-5"><EmptyState title="No attendance yet today" /></div>}
          {todays.map((a) => {
            const open = !a.clockOut;
            const hrs = hoursBetween(a.clockIn, a.clockOut ?? new Date());
            return (
              <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={a.profile.fullName} color={a.profile.avatarColor} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.profile.fullName}</p>
                  <p className="truncate text-xs text-[var(--text-dim)]">{a.profile.jobRole}</p>
                </div>
                <span className="text-xs text-[var(--text-dim)]">
                  <LocalTime iso={a.clockIn.toISOString()} mode="time" />
                  {" – "}
                  {a.clockOut ? <LocalTime iso={a.clockOut.toISOString()} mode="time" /> : "now"}
                </span>
                <span className="w-14 text-right text-sm font-medium">{hrs.toFixed(1)}h</span>
                {open ? (
                  <Badge color="var(--success)">Active</Badge>
                ) : (
                  <Badge>Done</Badge>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
