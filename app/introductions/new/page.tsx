import { AppShell } from "@/components/AppShell";
import { saveIntroductionAction } from "@/lib/actions";
import { requireMember } from "@/lib/auth";
import { getMembers } from "@/lib/data";

export default async function NewIntroductionPage() {
  const member = await requireMember();
  const members = await getMembers();

  return (
    <AppShell member={member}>
      <section className="card stack">
        <h1 className="sectionTitle">Make an introduction</h1>
        <p className="muted">This is logged for you as the member making the introduction.</p>
        <form action={saveIntroductionAction} className="formGrid">
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
            Contact name
            <input className="input" name="contactName" required />
          </label>
          <label className="label">
            Contact company
            <input className="input" name="contactCompany" />
          </label>
          <label className="label">
            Status
            <select className="select" name="status" defaultValue="MADE">
              <option value="MADE">Made</option>
              <option value="MEETING_BOOKED">Meeting booked</option>
              <option value="OPPORTUNITY_CREATED">Opportunity created</option>
            </select>
          </label>
          <label className="label">
            Notes
            <textarea className="textarea" name="notes" placeholder="Optional" />
          </label>
          <button className="primaryButton" type="submit">
            Save introduction
          </button>
        </form>
      </section>
    </AppShell>
  );
}
