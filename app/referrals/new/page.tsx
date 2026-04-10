import { AppShell } from "@/components/AppShell";
import { Notice } from "@/components/Notice";
import { saveReferralAction } from "@/lib/actions";
import { requireMember } from "@/lib/auth";
import { getMembers, getNextMeeting } from "@/lib/data";

export default async function NewReferralPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const member = await requireMember();
  const [members, nextMeeting, params] = await Promise.all([getMembers(), getNextMeeting(), searchParams]);

  return (
    <AppShell member={member}>
      <section className="card stack">
        <h1 className="sectionTitle">Pass a referral</h1>
        {params.error ? <Notice tone="error">{params.error}</Notice> : null}
        <form action={saveReferralAction} className="formGrid">
          {nextMeeting ? <input type="hidden" name="meetingId" value={nextMeeting.id} /> : null}
          <label className="label">
            Referral for
            <select className="select" name="recipient" required defaultValue="">
              <option value="" disabled>
                Choose who this is for
              </option>
              {members
                .filter((item) => item.id !== member.id)
                .map((item) => (
                  <option key={item.id} value={`member:${item.id}`}>
                    {item.name} - {item.businessName}
                  </option>
                ))}
            </select>
          </label>
          <label className="label">
            Lead name
            <input className="input" name="leadName" required />
          </label>
          <label className="label">
            Lead contact
            <input className="input" name="leadContact" />
          </label>
          <label className="label">
            Notes
            <textarea className="textarea" name="notes" />
          </label>
          <button className="primaryButton" type="submit">
            Save referral
          </button>
        </form>
      </section>
    </AppShell>
  );
}
