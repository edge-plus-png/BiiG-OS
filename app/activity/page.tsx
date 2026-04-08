import { AppShell } from "@/components/AppShell";
import { MemberActivityView } from "@/components/activity/MemberActivityView";
import { requireMember } from "@/lib/auth";
import { getMemberActivityDataWithFilters } from "@/lib/data";

function parseDate(value?: string, endOfDay = false) {
  if (!value) return undefined;
  const suffix = endOfDay ? "T23:59:59.999" : "T00:00:00.000";
  return new Date(`${value}${suffix}`);
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; type?: "all" | "referrals" | "thank-you" | "one-to-ones" | "visitors" | "testimonials" | "introductions" }>;
}) {
  const member = await requireMember();
  const params = await searchParams;
  const data = await getMemberActivityDataWithFilters(member.id, {
    from: parseDate(params.from),
    to: parseDate(params.to, true),
  });

  return (
    <AppShell member={member}>
      <MemberActivityView
        data={data}
        heading="My activity"
        helperText="Use this to check what you have passed, received, logged, and shared without asking leadership to dig through exports."
        filterAction="/activity"
        selectedType={params.type ?? "all"}
      />
    </AppShell>
  );
}
