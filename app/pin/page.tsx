import { AppShell } from "@/components/AppShell";
import { Notice } from "@/components/Notice";
import { changeOwnPinAction, updateOwnDetailsAction } from "@/lib/actions";
import { requireMember } from "@/lib/auth";

export default async function PinPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const member = await requireMember();
  const params = await searchParams;

  return (
    <AppShell member={member}>
      <section className="card stack">
        <div>
          <h1 className="sectionTitle">My details</h1>
          <p className="muted">Keep your business and contact details up to date here.</p>
        </div>
        {params.saved === "details" ? <Notice tone="success">Details updated.</Notice> : null}
        {params.saved === "pin" || params.saved === "1" ? <Notice tone="success">PIN updated.</Notice> : null}
        {params.error ? <Notice tone="error">{params.error}</Notice> : null}
        <form action={updateOwnDetailsAction} className="formGrid">
          <label className="label">
            Name
            <input className="input" name="name" defaultValue={member.name} required />
          </label>
          <label className="label">
            Business
            <input className="input" name="businessName" defaultValue={member.businessName} required />
          </label>
          <label className="label">
            Email
            <input className="input" name="email" type="email" defaultValue={member.email ?? ""} />
          </label>
          <label className="label">
            Phone
            <input className="input" name="phone" defaultValue={member.phone ?? ""} />
          </label>
          <label className="label">
            Breakfast choice
            <input className="input" name="breakfastChoice" defaultValue={member.breakfastChoice ?? ""} />
          </label>
          <label className="label">
            Dietary notes
            <input className="input" name="dietaryNotes" defaultValue={member.dietaryNotes ?? ""} />
          </label>
          <button className="primaryButton" type="submit">
            Save details
          </button>
        </form>
      </section>

      <section className="card stack">
        <div>
          <h2 className="sectionTitle">Change PIN</h2>
          <p className="muted">Keep it short and easy to remember, but not obvious.</p>
        </div>
        <form action={changeOwnPinAction} className="formGrid">
          <label className="label">
            Current PIN
            <input className="input" name="currentPin" type="password" inputMode="numeric" minLength={4} maxLength={12} required />
          </label>
          <label className="label">
            New PIN
            <input className="input" name="newPin" type="password" inputMode="numeric" minLength={4} maxLength={12} required />
          </label>
          <label className="label">
            Confirm new PIN
            <input className="input" name="confirmPin" type="password" inputMode="numeric" minLength={4} maxLength={12} required />
          </label>
          <button className="primaryButton" type="submit">
            Save new PIN
          </button>
        </form>
      </section>
    </AppShell>
  );
}
