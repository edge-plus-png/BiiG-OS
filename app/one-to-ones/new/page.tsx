import { format } from "date-fns";
import { AppShell } from "@/components/AppShell";
import { saveOneToOneAction } from "@/lib/actions";
import { requireMember } from "@/lib/auth";
import { getMembers } from "@/lib/data";

export default async function NewOneToOnePage() {
  const member = await requireMember();
  const members = await getMembers();

  return (
    <AppShell member={member}>
      <section className="card stack">
        <h1 className="sectionTitle">Log a 1-2-1</h1>
        <form action={saveOneToOneAction} className="formGrid">
          <label className="label">
            Other member
            <select className="select" name="otherMemberId" required defaultValue="">
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
            Date
            <input className="input" name="meetingDate" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
          </label>
          <button className="primaryButton" type="submit">
            Save 1-2-1
          </button>
        </form>
      </section>
    </AppShell>
  );
}
