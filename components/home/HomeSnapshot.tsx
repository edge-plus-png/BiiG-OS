"use client";

import { useState } from "react";
import { currency } from "@/lib/utils";

type MetricsData = Awaited<ReturnType<typeof import("@/lib/data").getHomeMetricsData>>;

export function HomeSnapshot({ data }: { data: MetricsData }) {
  const [range, setRange] = useState<"month" | "year">("month");
  const metrics = range === "month" ? data.metrics.monthToDate : data.metrics.yearToDate;

  return (
    <section className="card stack">
      <div className="appHeader snapshotHeader">
        <div>
          <h2 className="sectionTitle">Snapshot</h2>
          <p className="muted smallText">Month to date first. Toggle to year for the wider view.</p>
        </div>
        <div className="snapshotToggle" role="tablist" aria-label="Snapshot range">
          <button
            className={`snapshotToggleButton${range === "month" ? " snapshotToggleButtonActive" : ""}`}
            type="button"
            onClick={() => setRange("month")}
          >
            Month
          </button>
          <button
            className={`snapshotToggleButton${range === "year" ? " snapshotToggleButtonActive" : ""}`}
            type="button"
            onClick={() => setRange("year")}
          >
            Year
          </button>
        </div>
      </div>

      <div className="snapshotGrid">
        <div className="metricCard snapshotCard">
          <span className="splitMetricLabel">Given</span>
          <span className="muted smallText">Referrals passed</span>
          <span className="metricValue">{metrics.referralsPassed}</span>
        </div>
        <div className="metricCard snapshotCard">
          <span className="splitMetricLabel">Received</span>
          <span className="muted smallText">Referrals received</span>
          <span className="metricValue">{metrics.referralsReceived}</span>
        </div>
        <div className="metricCard snapshotCard">
          <span className="splitMetricLabel">Shared</span>
          <span className="muted smallText">1-2-1s</span>
          <span className="metricValue">{metrics.oneToOnes}</span>
        </div>
        <div className="metricCard snapshotCard">
          <span className="splitMetricLabel">Received</span>
          <span className="muted smallText">Business received</span>
          <span className="metricValue">{currency(metrics.thankYouReceived)}</span>
        </div>
        <div className="metricCard snapshotCard">
          <span className="splitMetricLabel">Given</span>
          <span className="muted smallText">Visitors brought</span>
          <span className="metricValue">{metrics.visitors}</span>
        </div>
        <div className="metricCard snapshotCard">
          <span className="splitMetricLabel">Given</span>
          <span className="muted smallText">Testimonials</span>
          <span className="metricValue">{metrics.testimonialsGiven}</span>
        </div>
        <div className="metricCard snapshotCard">
          <span className="splitMetricLabel">Given</span>
          <span className="muted smallText">Introductions</span>
          <span className="metricValue">{metrics.introductionsGiven}</span>
        </div>
      </div>

      <p className="muted smallText">Snapshot now shows whether each item is given, received or shared. 1-2-1s count for both members.</p>
    </section>
  );
}
