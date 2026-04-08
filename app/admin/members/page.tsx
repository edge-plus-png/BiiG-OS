import Link from "next/link";
import { MemberRole } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { Notice } from "@/components/Notice";
import {
  createMemberAction,
  deleteMemberAction,
  resetPinAction,
  toggleMemberArchivedAction,
  updateMemberRoleAction,
} from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { getAdminMembers } from "@/lib/data";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    pin?: string;
    created?: string;
    reset?: string;
    role?: string;
    archived?: string;
    restored?: string;
    deleted?: string;
    error?: string;
    q?: string;
  }>;
}) {
  const admin = await requireAdmin();
  const [members, params] = await Promise.all([getAdminMembers(), searchParams]);
  const revealedPin = params.pin;
  const query = params.q?.trim().toLowerCase() ?? "";
  const filteredMembers = query
    ? members.filter((member) => `${member.name} ${member.businessName} ${member.email ?? ""}`.toLowerCase().includes(query))
    : members;

  return (
    <AppShell member={admin}>
      {revealedPin ? (
        <section className="card stack">
          <h1 className="sectionTitle">PIN revealed once</h1>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0b54a3" }}>{revealedPin}</div>
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
            Email
            <input className="input" name="email" type="email" />
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
        <form action="/admin/members" className="formGrid">
          <label className="label">
            Search members
            <input className="input" name="q" defaultValue={params.q ?? ""} placeholder="Name or business" />
          </label>
          <button className="secondaryButton" type="submit">
            Filter
          </button>
        </form>
        {params.created ? <Notice tone="success">Member created and PIN revealed above.</Notice> : null}
        {params.reset ? <Notice tone="success">PIN reset and revealed above.</Notice> : null}
        {params.role ? <Notice tone="success">Member role updated.</Notice> : null}
        {params.archived ? <Notice tone="success">Member archived.</Notice> : null}
        {params.restored ? <Notice tone="success">Member restored.</Notice> : null}
        {params.deleted ? <Notice tone="success">Member deleted.</Notice> : null}
        {params.error ? <Notice tone="error">{params.error}</Notice> : null}
        <div className="list">
          {filteredMembers.map((member) => (
            <div key={member.id} className="listRow">
              <div style={{ fontWeight: 700 }}>
                {member.name} - {member.businessName}
              </div>
              <div className="muted smallText">
                {member.role === MemberRole.ADMIN ? "Leadership" : "Member"}
                {!member.isActive ? " - Archived" : ""}
              </div>
              {member.email ? <div className="muted smallText">{member.email}</div> : null}
              <div className="muted smallText">
                {member.breakfastChoice || "No breakfast set"}
                {member.dietaryNotes ? ` - ${member.dietaryNotes}` : ""}
              </div>
              <div className="inlineActions">
                <Link className="secondaryButton" href={`/admin/members/${member.id}`}>
                  View activity
                </Link>
              </div>
              <form action={updateMemberRoleAction} className="formGrid">
                <input type="hidden" name="memberId" value={member.id} />
                <label className="label">
                  Role
                  <select className="select" name="role" defaultValue={member.role}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Leadership</option>
                  </select>
                </label>
                <button className="secondaryButton" type="submit">
                  Save role
                </button>
              </form>
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
              <div className="inlineActions">
                <form action={toggleMemberArchivedAction}>
                  <input type="hidden" name="memberId" value={member.id} />
                  <input type="hidden" name="archive" value={member.isActive ? "yes" : "no"} />
                  <button className="secondaryButton" type="submit">
                    {member.isActive ? "Archive member" : "Restore member"}
                  </button>
                </form>
                <form action={deleteMemberAction}>
                  <input type="hidden" name="memberId" value={member.id} />
                  <button className="dangerButton" type="submit">
                    Delete member
                  </button>
                </form>
              </div>
            </div>
          ))}
          {!filteredMembers.length ? <div className="muted">No members match that search.</div> : null}
        </div>
      </section>
    </AppShell>
  );
}
