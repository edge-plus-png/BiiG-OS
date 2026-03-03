import { AppShell } from "@/components/AppShell";
import { saveVisitorAction } from "@/lib/actions";
import { requireMember } from "@/lib/auth";
import { getNextMeeting } from "@/lib/data";

export default async function NewVisitorPage() {
  const member = await requireMember();
  const nextMeeting = await getNextMeeting();

  if (!nextMeeting) {
    return <AppShell member={member}>No upcoming meeting found.</AppShell>;
  }

  return (
    <AppShell member={member}>
      <section className="card stack">
        <h1 className="sectionTitle">Add a visitor</h1>
        <form action={saveVisitorAction} className="formGrid">
          <input type="hidden" name="meetingId" value={nextMeeting.id} />
          <label className="label">
            Visitor name
            <input className="input" name="visitorName" required />
          </label>
          <label className="label">
            Visitor business
            <input className="input" name="visitorBusiness" />
          </label>
          <label className="label">
            Likelihood
            <select className="select" name="likelihood" defaultValue="HIGH">
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </label>
          <button className="primaryButton" type="submit">
            Save visitor
          </button>
        </form>
      </section>
    </AppShell>
  );
}
