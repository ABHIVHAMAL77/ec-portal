import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { EMPLOYMENT_LABEL } from "@/lib/constants";
import { Card, Badge, Avatar } from "@/components/ui";
import { AddEmployeeButton } from "@/components/add-employee";
import { EditEmployeeButton } from "@/components/edit-employee";

const ACCESS_LABEL: Record<string, string> = {
  admin: "Admin",
  manager: "Dept. Head",
  member: "Member",
};
const ACCESS_COLOR: Record<string, string> = {
  admin: "#d6a43e",
  manager: "#c3cad6",
  member: "#8b95ad",
};
const EMP_COLOR: Record<string, string> = {
  full_time: "#35b06a",
  part_time: "#e0a63a",
  freelancer: "#8595ad",
};

export default async function PeoplePage() {
  const user = await requireUser();
  const isAdmin = user.accessLevel === "admin";

  const [departments, unassigned] = await Promise.all([
    prisma.department.findMany({
      orderBy: { name: "asc" },
      include: {
        members: {
          orderBy: { accessLevel: "asc" },
          include: { reportsTo: { select: { fullName: true } } },
        },
      },
    }),
    prisma.profile.findMany({
      where: { departmentId: null },
      orderBy: { accessLevel: "asc" },
      include: { reportsTo: { select: { fullName: true } } },
    }),
  ]);

  const allPeople = [...departments.flatMap((d) => d.members), ...unassigned];
  const total = allPeople.length;
  const deptOpts = departments.map((d) => ({ id: d.id, label: d.name }));
  const peopleOpts = allPeople.map((p) => ({ id: p.id, label: p.fullName }));

  const groups = [
    ...departments
      .filter((d) => d.members.length > 0)
      .map((d) => ({ id: d.id, name: d.name, color: d.color, members: d.members })),
    ...(unassigned.length
      ? [{ id: "unassigned", name: "Unassigned", color: "#646d7e", members: unassigned }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team & Departments</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {total} people across {departments.filter((d) => d.members.length).length} active departments.
          </p>
        </div>
        {isAdmin && (
          <AddEmployeeButton
            departments={departments.map((d) => ({ id: d.id, label: d.name }))}
            people={allPeople.map((p) => ({ id: p.id, label: p.fullName }))}
          />
        )}
      </div>

      <div className="space-y-6">
        {groups.map((dept) => (
            <div key={dept.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dept.color }} />
                <h3 className="font-semibold">{dept.name}</h3>
                <span className="text-sm text-[var(--text-dim)]">({dept.members.length})</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dept.members.map((m) => (
                  <Card key={m.id} className={`flex items-start gap-3 p-4 ${m.status === "inactive" ? "opacity-50" : ""}`}>
                    <Avatar name={m.fullName} color={m.avatarColor} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{m.fullName}</p>
                      <p className="truncate text-xs text-[var(--text-muted)]">{m.jobRole}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Badge color={ACCESS_COLOR[m.accessLevel]}>{ACCESS_LABEL[m.accessLevel]}</Badge>
                        <Badge color={EMP_COLOR[m.employmentType]}>
                          {EMPLOYMENT_LABEL[m.employmentType]}
                        </Badge>
                        {m.status === "inactive" && <Badge color="#e35b52">Inactive</Badge>}
                      </div>
                      {m.reportsTo && (
                        <p className="mt-2 text-[11px] text-[var(--text-dim)]">
                          Reports to {m.reportsTo.fullName}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <EditEmployeeButton
                        member={{
                          id: m.id,
                          fullName: m.fullName,
                          email: m.email,
                          jobRole: m.jobRole,
                          departmentId: m.departmentId,
                          accessLevel: m.accessLevel,
                          employmentType: m.employmentType,
                          reportsToId: m.reportsToId,
                          fullAccess: m.fullAccess,
                          status: m.status,
                        }}
                        departments={deptOpts}
                        people={peopleOpts}
                      />
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
