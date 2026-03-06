import { currency } from "@/lib/utils";
import { getHomeMetricsData } from "@/lib/data";

export async function HomeMetrics({ memberId }: { memberId: string }) {
  const data = await getHomeMetricsData(memberId);

  return (
    <>
      <section className="card">
        <h2 className="sectionTitle">Month to date</h2>
        <div className="metricRow">
          <div className="metricCard">
            <span className="muted smallText">Passed</span>
            <span className="metricValue">{data.metrics.monthToDate.referralsPassed}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">1-2-1s</span>
            <span className="metricValue">{data.metrics.monthToDate.oneToOnes}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Received</span>
            <span className="metricValue">{data.metrics.monthToDate.referralsReceived}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Thank you</span>
            <span className="metricValue">{currency(data.metrics.monthToDate.thankYouReceived)}</span>
          </div>
        </div>
        <div className="metricRow" style={{ marginTop: 10 }}>
          <div className="metricCard">
            <span className="muted smallText">Visitors</span>
            <span className="metricValue">{data.metrics.monthToDate.visitors}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Testimonials</span>
            <span className="metricValue">{data.metrics.monthToDate.testimonialsGiven}</span>
          </div>
        </div>
        <p className="muted smallText" style={{ marginTop: 12 }}>
          One 1-2-1 entry counts for both members. Referrals are split into passed and received. Testimonials are giver-only.
        </p>
      </section>

      <section className="card">
        <h2 className="sectionTitle">Year to date</h2>
        <div className="metricRow">
          <div className="metricCard">
            <span className="muted smallText">Passed</span>
            <span className="metricValue">{data.metrics.yearToDate.referralsPassed}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">1-2-1s</span>
            <span className="metricValue">{data.metrics.yearToDate.oneToOnes}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Received</span>
            <span className="metricValue">{data.metrics.yearToDate.referralsReceived}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Thank you</span>
            <span className="metricValue">{currency(data.metrics.yearToDate.thankYouReceived)}</span>
          </div>
        </div>
        <div className="metricRow" style={{ marginTop: 10 }}>
          <div className="metricCard">
            <span className="muted smallText">Visitors</span>
            <span className="metricValue">{data.metrics.yearToDate.visitors}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Testimonials</span>
            <span className="metricValue">{data.metrics.yearToDate.testimonialsGiven}</span>
          </div>
        </div>
      </section>
    </>
  );
}

export function HomeMetricsFallback() {
  return (
    <>
      <section className="card">
        <h2 className="sectionTitle">Month to date</h2>
        <p className="muted">Loading stats...</p>
      </section>
      <section className="card">
        <h2 className="sectionTitle">Year to date</h2>
        <p className="muted">Loading stats...</p>
      </section>
    </>
  );
}
