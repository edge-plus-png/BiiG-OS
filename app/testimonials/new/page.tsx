import { AppShell } from "@/components/AppShell";
import { saveTestimonialAction } from "@/lib/actions";
import { requireMember } from "@/lib/auth";
import { getMembers } from "@/lib/data";

export default async function NewTestimonialPage() {
  const member = await requireMember();
  const members = await getMembers();

  return (
    <AppShell member={member}>
      <section className="card stack">
        <h1 className="sectionTitle">Give a testimonial</h1>
        <p className="muted">This is logged for you as the giver only.</p>
        <form action={saveTestimonialAction} className="formGrid">
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
            Notes
            <textarea className="textarea" name="notes" placeholder="Optional" />
          </label>
          <button className="primaryButton" type="submit">
            Save testimonial
          </button>
        </form>
      </section>
    </AppShell>
  );
}
