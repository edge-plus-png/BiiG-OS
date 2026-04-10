import { AppShell } from "@/components/AppShell";
import { Notice } from "@/components/Notice";
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
  searchParams: Promise<{
    from?: string;
    to?: string;
    type?: "all" | "referrals" | "thank-you" | "one-to-ones" | "visitors" | "testimonials" | "introductions";
    saved?: string;
    error?: string;
  }>;
}) {
  const admin = await requireAdmin();
  const [{ memberId }, filters] = await Promise.all([params, searchParams]);
  const data = await getMemberActivityDataWithFilters(memberId, {
    from: parseDate(filters.from),
    to: parseDate(filters.to, true),
  });

  return (
    <AppShell member={admin}>
      {filters.saved === "referral-updated" ? <Notice tone="success">Referral updated.</Notice> : null}
      {filters.saved === "referral-deleted" ? <Notice tone="success">Referral deleted.</Notice> : null}
      {filters.saved === "thankyou-updated" ? <Notice tone="success">Thank you updated.</Notice> : null}
      {filters.saved === "thankyou-deleted" ? <Notice tone="success">Thank you deleted.</Notice> : null}
      {filters.saved === "one-to-one-deleted" ? <Notice tone="success">1-2-1 deleted.</Notice> : null}
      {filters.saved === "visitor-deleted" ? <Notice tone="success">Visitor deleted.</Notice> : null}
      {filters.saved === "testimonial-deleted" ? <Notice tone="success">Testimonial deleted.</Notice> : null}
      {filters.saved === "introduction-deleted" ? <Notice tone="success">Introduction deleted.</Notice> : null}
      {filters.error ? <Notice tone="error">{filters.error}</Notice> : null}
      <MemberActivityView
        data={data}
        heading="Member activity"
        backHref="/admin/members"
        backLabel="Back to members"
        helperText="This is the same self-serve ledger members can use, exposed here so leadership can quickly sense-check claims without doing manual admin work."
        filterAction={`/admin/members/${memberId}`}
        selectedType={filters.type ?? "all"}
        adminManagePath={`/admin/members/${memberId}`}
      />
    </AppShell>
  );
}
