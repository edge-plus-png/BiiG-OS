import { AppShell } from "@/components/AppShell";
import { Notice } from "@/components/Notice";
import { changeOwnPinAction } from "@/lib/actions";
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
          <h1 className="sectionTitle">My PIN</h1>
          <p className="muted">Change your PIN here. Keep it short and easy enough to remember, but not obvious.</p>
        </div>
        {params.saved ? <Notice tone="success">PIN updated.</Notice> : null}
        {params.error ? <Notice tone="error">{params.error}</Notice> : null}
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
