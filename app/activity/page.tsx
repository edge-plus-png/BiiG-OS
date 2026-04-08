import { AppShell } from "@/components/AppShell";
import { MemberActivityView } from "@/components/activity/MemberActivityView";
import { requireMember } from "@/lib/auth";
import { getMemberActivityData } from "@/lib/data";

export default async function ActivityPage() {
  const member = await requireMember();
  const data = await getMemberActivityData(member.id);

  return (
    <AppShell member={member}>
      <MemberActivityView
        data={data}
        heading="My activity"
        helperText="Use this to check what you have passed, received, logged, and shared without asking leadership to dig through exports."
      />
    </AppShell>
  );
}
