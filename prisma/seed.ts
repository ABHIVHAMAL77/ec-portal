import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// ---- Change these before going live ----
const ADMIN_EMAIL = "abhiv@esportscounty.com";
const ADMIN_NAME = "Founder / CEO";
const ADMIN_PASSWORD = "esports123"; // change this on first login

const departments = [
  { name: "Management", slug: "management", color: "#d6a43e" },
  { name: "Creative", slug: "creative", color: "#c9748a" },
  { name: "Marketing", slug: "marketing", color: "#e0a63a" },
  { name: "Operations", slug: "operations", color: "#5fa8b3" },
  { name: "Production", slug: "production", color: "#e35b52" },
  { name: "Finance", slug: "finance", color: "#35b06a" },
  { name: "Community", slug: "community", color: "#a88bc4" },
  { name: "Technical", slug: "technical", color: "#6b8cc4" },
  { name: "Sales", slug: "sales", color: "#4fb0a0" },
];

async function main() {
  console.log("Setting up a clean Esports County portal...");

  // Wipe everything (FK-safe order)
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.eventComment.deleteMany(),
    prisma.taskComment.deleteMany(),
    prisma.task.deleteMany(),
    prisma.project.deleteMany(),
    prisma.kpi.deleteMany(),
    prisma.eventApproval.deleteMany(),
    prisma.eventCrew.deleteMany(),
    prisma.runOfShowItem.deleteMany(),
    prisma.budget.deleteMany(),
    prisma.meetingPrep.deleteMany(),
    prisma.meeting.deleteMany(),
    prisma.event.deleteMany(),
    prisma.weeklyGoal.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.escalation.deleteMany(),
    prisma.manpowerRequest.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.session.deleteMany(),
  ]);
  await prisma.profile.updateMany({ data: { departmentId: null, reportsToId: null } });
  await prisma.department.updateMany({ data: { headId: null } });
  await prisma.profile.deleteMany();
  await prisma.department.deleteMany();

  // Departments
  const deptByName: Record<string, string> = {};
  for (const d of departments) {
    const rec = await prisma.department.create({ data: d });
    deptByName[d.name] = rec.id;
  }

  // One admin account (the Founder). Everyone else is added in-app.
  await prisma.profile.create({
    data: {
      email: ADMIN_EMAIL.toLowerCase(),
      fullName: ADMIN_NAME,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      jobRole: "Founder / CEO",
      accessLevel: "admin",
      fullAccess: true,
      employmentType: "full_time",
      departmentId: deptByName["Management"],
      avatarColor: "#d6a43e",
    },
  });

  console.log(`\nClean setup complete: ${departments.length} departments, 1 admin.`);
  console.log(`\nLog in as:  ${ADMIN_EMAIL}`);
  console.log(`Password:   ${ADMIN_PASSWORD}  (change it after first login)`);
  console.log(`\nThen use Team → “Add employee” to onboard everyone else.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
