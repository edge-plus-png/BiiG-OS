import { getHomeMetricsData } from "@/lib/data";
import { HomeSnapshot } from "@/components/home/HomeSnapshot";

export async function HomeMetrics({ memberId }: { memberId: string }) {
  const data = await getHomeMetricsData(memberId);
  return <HomeSnapshot data={data} />;
}

export function HomeMetricsFallback() {
  return (
    <section className="card">
      <h2 className="sectionTitle">Snapshot</h2>
      <p className="muted">Loading stats...</p>
    </section>
  );
}
