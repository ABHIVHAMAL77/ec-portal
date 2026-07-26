import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isApprover, isManagerLevel, isFinanceViewer } from "@/lib/access";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { MobileNav } from "@/components/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [unread, financeViewer] = await Promise.all([
    prisma.notification.count({ where: { recipientId: user.id, readAt: null } }),
    isFinanceViewer(user),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        isApprover={isApprover(user)}
        isManager={isManagerLevel(user)}
        isFinance={financeViewer}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          unread={unread}
          user={{
            fullName: user.fullName,
            jobRole: user.jobRole,
            employmentType: user.employmentType,
            avatarColor: user.avatarColor,
            departmentName: user.department?.name ?? null,
          }}
        />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
