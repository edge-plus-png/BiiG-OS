import { AppShell } from "@/components/AppShell";
import { createMemberAction, resetPinAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getMembers } from "@/lib/data";
import { env } from "@/lib/env";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ pin?: string; created?: string; reset?: string }>;
}) {
  const admin = await requireAdmin();
  const [members, params] = await Promise.all([getMembers(), searchParams]);
  const revealedPin = params.pin;

  return (
    <AppShell member={admin}>
      {revealedPin ? (
        <section className="card stack">
          <h1 className="sectionTitle">PIN revealed once</h1>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0b54a3" }}>{revealedPin}</div>
          <div className="muted smallText">Share: Go to {env.APP_URL} - pick your name - enter PIN</div>
        </section>
      ) : null}

      <section className="card stack">
        <h1 className="sectionTitle">Onboard member</h1>
        <form action={createMemberAction} className="formGrid">
          <label className="label">
            Name
            <input className="input" name="name" required />
          </label>
          <label className="label">
            Business
            <input className="input" name="businessName" required />
          </label>
          <label className="label">
            Phone
            <input className="input" name="phone" />
          </label>
          <label className="label">
            Breakfast choice
            <input className="input" name="breakfastChoice" />
          </label>
          <label className="label">
            Dietary notes
            <input className="input" name="dietaryNotes" />
          </label>
          <label className="label">
            PIN
            <input className="input" name="pin" inputMode="numeric" placeholder="Leave blank to auto-generate" />
          </label>
          <label className="label">
            Role
            <select className="select" name="role" defaultValue="MEMBER">
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Leadership</option>
            </select>
          </label>
          <button className="primaryButton" type="submit">
            Create member
          </button>
        </form>
      </section>

      <section className="card stack">
        <h2 className="sectionTitle">Members</h2>
        <div className="list">
          {members.map((member) => (
            <div key={member.id} className="listRow">
              <div style={{ fontWeight: 700 }}>
                {member.name} - {member.businessName}
              </div>
              <div className="muted smallText">
                {member.breakfastChoice || "No breakfast set"}
                {member.dietaryNotes ? ` - ${member.dietaryNotes}` : ""}
              </div>
              <form action={resetPinAction} className="formGrid">
                <input type="hidden" name="memberId" value={member.id} />
                <label className="label">
                  Reset PIN
                  <input className="input" name="pin" inputMode="numeric" placeholder="Leave blank to auto-generate" />
                </label>
                <button className="secondaryButton" type="submit">
                  Reset PIN
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
