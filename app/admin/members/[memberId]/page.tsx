import { AppShell } from "@/components/AppShell";
import { MemberActivityView } from "@/components/activity/MemberActivityView";
import { requireAdmin } from "@/lib/auth";
import { getMemberActivityData } from "@/lib/data";

export default async function AdminMemberActivityPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const admin = await requireAdmin();
  const { memberId } = await params;
  const data = await getMemberActivityData(memberId);

  return (
    <AppShell member={admin}>
      <MemberActivityView
        data={data}
        heading="Member activity"
        backHref="/admin/members"
        backLabel="Back to members"
        helperText="This is the same self-serve ledger members can use, exposed here so leadership can quickly sense-check claims without doing manual admin work."
      />
    </AppShell>
  );
}
