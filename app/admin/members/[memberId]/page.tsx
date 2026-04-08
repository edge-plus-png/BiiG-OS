import { AppShell } from "@/components/AppShell";
import { MemberActivityView } from "@/components/activity/MemberActivityView";
import { requireAdmin } from "@/lib/auth";
import { getMemberActivityDataWithFilters } from "@/lib/data";

function parseDate(value?: string, endOfDay = false) {
  if (!value) return undefined;
  const suffix = endOfDay ? "T23:59:59.999" : "T00:00:00.000";
  return new Date(`${value}${suffix}`);
}

export default async function AdminMemberActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ from?: string; to?: string; type?: "all" | "referrals" | "thank-you" | "one-to-ones" | "visitors" | "testimonials" | "introductions" }>;
}) {
  const admin = await requireAdmin();
  const [{ memberId }, filters] = await Promise.all([params, searchParams]);
  const data = await getMemberActivityDataWithFilters(memberId, {
    from: parseDate(filters.from),
    to: parseDate(filters.to, true),
  });

  return (
    <AppShell member={admin}>
      <MemberActivityView
        data={data}
        heading="Member activity"
        backHref="/admin/members"
        backLabel="Back to members"
        helperText="This is the same self-serve ledger members can use, exposed here so leadership can quickly sense-check claims without doing manual admin work."
        filterAction={`/admin/members/${memberId}`}
        selectedType={filters.type ?? "all"}
      />
    </AppShell>
  );
}
