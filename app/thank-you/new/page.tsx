import { AppShell } from "@/components/AppShell";
import { saveThankYouAction } from "@/lib/actions";
import { requireMember } from "@/lib/auth";
import { getMembers } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export default async function NewThankYouPage() {
  const member = await requireMember();
  const [members, referrals] = await Promise.all([
    getMembers(),
    prisma.referral.findMany({
      where: { fromMemberId: member.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { toMember: true },
    }),
  ]);

  return (
    <AppShell member={member}>
      <section className="card stack">
        <h1 className="sectionTitle">Thank you for the business</h1>
        <form action={saveThankYouAction} className="formGrid">
          <label className="label">
            To member
            <select className="select" name="toMemberId" required defaultValue="">
              <option value="" disabled>
                Choose a member
              </option>
              {members
                .filter((item) => item.id !== member.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {item.businessName}
                  </option>
                ))}
            </select>
          </label>
          <label className="label">
            Amount (£)
            <input className="input" name="amount" type="number" step="0.01" min="0.01" required />
          </label>
          <label className="label">
            Link to referral
            <select className="select" name="referralId" defaultValue="">
              <option value="">Optional</option>
              {referrals.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.toMember.name} - {item.leadName}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            Notes
            <textarea className="textarea" name="notes" />
          </label>
          <button className="primaryButton" type="submit">
            Save thank you
          </button>
        </form>
      </section>
    </AppShell>
  );
}
