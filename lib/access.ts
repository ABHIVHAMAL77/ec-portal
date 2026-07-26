import { Prisma } from "@prisma/client";
import { CORE_APPROVAL_ROLES } from "./constants";
import { prisma } from "./db";

export type AccessUser = {
  id: string;
  accessLevel: string;
  jobRole: string;
  fullAccess?: boolean;
  departmentId: string | null;
};

// Full company-wide visibility: admins (Founder) and anyone flagged fullAccess (COO).
export function canSeeAll(u: AccessUser): boolean {
  return u.accessLevel === "admin" || u.fullAccess === true;
}

// Department heads / managers (see their department). Execs included.
export function isManagerLevel(u: AccessUser): boolean {
  return u.accessLevel !== "member";
}

// Only the Founder pitches new projects (workflow §2).
export function isFounder(u: AccessUser): boolean {
  return u.accessLevel === "admin";
}

// One of the 6 core approval positions.
export function isApprover(u: AccessUser): boolean {
  return CORE_APPROVAL_ROLES.includes(u.jobRole);
}

// Payment submissions hold bank + tax data, so only the Founder (admin),
// the COO (fullAccess) and the Finance department head may see them.
export async function isFinanceViewer(u: AccessUser): Promise<boolean> {
  if (canSeeAll(u)) return true;
  const finance = await prisma.department.findFirst({ where: { slug: "finance" } });
  return Boolean(finance?.headId && finance.headId === u.id);
}

// Prisma filter: which tasks this user may see.
export function taskWhere(u: AccessUser): Prisma.TaskWhereInput {
  if (canSeeAll(u)) return {};
  const or: Prisma.TaskWhereInput[] = [{ assigneeId: u.id }, { createdById: u.id }];
  if (isManagerLevel(u) && u.departmentId) or.push({ departmentId: u.departmentId });
  return { OR: or };
}

// Prisma filter: which events this user may see.
export function eventWhere(u: AccessUser): Prisma.EventWhereInput {
  if (canSeeAll(u)) return {};
  const or: Prisma.EventWhereInput[] = [
    { createdById: u.id },
    { tasks: { some: { assigneeId: u.id } } },
    { crew: { some: { profileId: u.id } } },
    { approvals: { some: { approverId: u.id } } },
  ];
  if (isManagerLevel(u) && u.departmentId) {
    or.push({ tasks: { some: { departmentId: u.departmentId } } });
  }
  return { OR: or };
}
