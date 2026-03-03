import { AppShell } from "@/components/AppShell";
import { saveReferralAction } from "@/lib/actions";
import { requireMember } from "@/lib/auth";
import { getMembers, getNextMeeting } from "@/lib/data";

export default async function NewReferralPage() {
  const member = await requireMember();
  const [members, nextMeeting] = await Promise.all([getMembers(), getNextMeeting()]);

  return (
    <AppShell member={member}>
      <section className="card stack">
        <h1 className="sectionTitle">Pass a referral</h1>
        <form action={saveReferralAction} className="formGrid">
          {nextMeeting ? <input type="hidden" name="meetingId" value={nextMeeting.id} /> : null}
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
