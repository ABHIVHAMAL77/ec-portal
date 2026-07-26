import { requireUser } from "@/lib/auth";
import { EMPLOYMENT_LABEL } from "@/lib/constants";
import { Card, CardHeader, Avatar, Badge } from "@/components/ui";
import { ChangePassword } from "@/components/change-password";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold">My Account</h2>

      <Card className="flex items-center gap-4 p-5">
        <Avatar name={user.fullName} color={user.avatarColor} size={56} />
        <div>
          <p className="text-lg font-semibold">{user.fullName}</p>
          <p className="text-sm text-[var(--text-muted)]">{user.jobRole}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge>{user.email}</Badge>
            {user.department?.name && <Badge color="var(--brand)">{user.department.name}</Badge>}
            <Badge color="var(--brand-2)">{EMPLOYMENT_LABEL[user.employmentType] ?? user.employmentType}</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Change password" subtitle="Keep your account secure" />
        <div className="p-5">
          <ChangePassword />
        </div>
      </Card>
    </div>
  );
}
