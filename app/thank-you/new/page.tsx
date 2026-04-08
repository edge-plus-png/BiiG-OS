import { AppShell } from "@/components/AppShell";
import { Notice } from "@/components/Notice";
import { ThankYouForm } from "@/components/ThankYouForm";
import { requireMember } from "@/lib/auth";
import { getMembers } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export default async function NewThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const member = await requireMember();
  const params = await searchParams;
  const [members, referrals] = await Promise.all([
    getMembers(),
    prisma.referral.findMany({
      where: { toMemberId: member.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { fromMember: true },
    }),
  ]);

  return (
    <AppShell member={member}>
      <section className="card stack">
        <h1 className="sectionTitle">Thank you for the business</h1>
        {params.error ? <Notice tone="error">{params.error}</Notice> : null}
        <ThankYouForm
          members={members.filter((item) => item.id !== member.id)}
          referrals={referrals.map((item) => ({
            id: item.id,
            fromMemberId: item.fromMemberId,
            leadName: item.leadName,
            fromMember: { name: item.fromMember.name, businessName: item.fromMember.businessName },
          }))}
        />
      </section>
    </AppShell>
  );
}
