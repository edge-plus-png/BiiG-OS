import { AppShell } from "@/components/AppShell";
import { requireAdmin } from "@/lib/auth";

const exportTypes = [
  { value: "referrals", label: "Referrals" },
  { value: "thank_you", label: "Thank you" },
  { value: "non_attendance", label: "Non-attendance" },
  { value: "one_to_one", label: "1-2-1s" },
  { value: "visitors", label: "Visitors" },
  { value: "monthly_summary", label: "Monthly summary" },
];

export default async function AdminExportsPage() {
  const admin = await requireAdmin();

  return (
    <AppShell member={admin}>
      <section className="card stack">
        <h1 className="sectionTitle">CSV exports</h1>
        <p className="muted">Choose a date range and export the dataset you need.</p>
        <div className="list">
          {exportTypes.map((item) => (
            <form key={item.value} action={`/admin/exports/${item.value}`} className="listRow">
              <div style={{ fontWeight: 700 }}>{item.label}</div>
              <div className="grid2">
                <label className="label">
                  From
                  <input className="input" type="date" name="from" />
                </label>
                <label className="label">
                  To
                  <input className="input" type="date" name="to" />
                </label>
              </div>
              <button className="primaryButton" type="submit">
                Download CSV
              </button>
            </form>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
