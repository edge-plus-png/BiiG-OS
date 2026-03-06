import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Notice } from "@/components/Notice";
import { StatusPill } from "@/components/StatusPill";
import { requireAdmin } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/data";
import { formatMeetingDate } from "@/lib/time";
import { currency } from "@/lib/utils";

export default async function AdminPage() {
  const member = await requireAdmin();
  const data = await getAdminDashboard();
  const overdueSpeakers = data.speakerWindow.filter((speaker) => speaker.status !== "CONFIRMED");
  const weeklySummaryText = data.nextMeeting
    ? `BiiG update for ${formatMeetingDate(data.nextMeeting.meetingDate)}: ${data.nextMeeting.nonAttendance.length} apologies, ${data.nextMeeting.nonAttendance.filter((item) => item.hasSub).length} subs, ${data.nextMeeting.visitors.length} visitors expected.`
    : "BiiG weekly update.";
  const monthlySummaryText = `BiiG month to date: ${data.metrics.monthToDate.referrals} referrals, ${data.metrics.monthToDate.oneToOnes} 1-2-1s, ${currency(data.metrics.monthToDate.thankYou)} thank you business, ${data.metrics.monthToDate.visitors} visitors.`;

  return (
    <AppShell member={member}>
      <section className="card stack">
        <div className="appHeader">
          <div>
            <h1 className="sectionTitle">Leadership dashboard</h1>
            <p className="muted">Quick view for the next meeting and this month.</p>
          </div>
          <div className="inlineActions">
            <Link className="secondaryButton" href="/admin/members">
              Members
            </Link>
            <Link className="secondaryButton" href="/admin/exports">
              Exports
            </Link>
          </div>
        </div>

        <div className="metricRow">
          <div className="metricCard">
            <span className="muted smallText">Referrals</span>
            <span className="metricValue">{data.metrics.monthToDate.referrals}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">1-2-1s</span>
            <span className="metricValue">{data.metrics.monthToDate.oneToOnes}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Business</span>
            <span className="metricValue">{currency(data.metrics.monthToDate.thankYou)}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Visitors</span>
            <span className="metricValue">{data.metrics.monthToDate.visitors}</span>
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2 className="sectionTitle">Year to date</h2>
        <div className="metricRow">
          <div className="metricCard">
            <span className="muted smallText">Referrals</span>
            <span className="metricValue">{data.metrics.yearToDate.referrals}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">1-2-1s</span>
            <span className="metricValue">{data.metrics.yearToDate.oneToOnes}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Business</span>
            <span className="metricValue">{currency(data.metrics.yearToDate.thankYou)}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Visitors</span>
            <span className="metricValue">{data.metrics.yearToDate.visitors}</span>
          </div>
        </div>
        <div className="inlineActions">
          <Link className="secondaryButton" href={`https://wa.me/?text=${encodeURIComponent(weeklySummaryText)}`} target="_blank">
            Share weekly summary
          </Link>
          <Link className="secondaryButton" href={`https://wa.me/?text=${encodeURIComponent(monthlySummaryText)}`} target="_blank">
            Share month summary
          </Link>
        </div>
      </section>

      <section className="card stack">
        <h2 className="sectionTitle">Next meeting summary</h2>
        {data.nextMeeting ? (
          <>
            <div style={{ fontWeight: 800 }}>{formatMeetingDate(data.nextMeeting.meetingDate)}</div>
            <div className="grid2">
              <div className="listRow">
                <div style={{ fontWeight: 700 }}>Non-attendees ({data.nextMeeting.nonAttendance.length})</div>
                {data.nextMeeting.nonAttendance.length ? (
                  data.nextMeeting.nonAttendance.map((item) => (
                    <div key={item.id} className="smallText">
                      {item.member.name}
                      {item.createdLate ? " (late)" : ""}
                    </div>
                  ))
                ) : (
                  <div className="muted smallText">No non-attendance logged.</div>
                )}
              </div>
              <div className="listRow">
                <div style={{ fontWeight: 700 }}>
                  Subs provided ({data.nextMeeting.nonAttendance.filter((item) => item.hasSub).length})
                </div>
                {data.nextMeeting.nonAttendance.filter((item) => item.hasSub).length ? (
                  data.nextMeeting.nonAttendance
                    .filter((item) => item.hasSub)
                    .map((item) => (
                      <div key={item.id} className="smallText">
                        {item.member.name}: {item.subName || "Yes"}
                      </div>
                    ))
                ) : (
                  <div className="muted smallText">No subs logged.</div>
                )}
              </div>
            </div>

            <div className="listRow">
              <div style={{ fontWeight: 700 }}>Visitors expected</div>
              {data.nextMeeting.visitors.length ? (
                data.nextMeeting.visitors.map((visitor) => (
                  <div key={visitor.id} className="smallText">
                    {visitor.visitorName} ({visitor.likelihood})
                  </div>
                ))
              ) : (
                <div className="muted smallText">No visitors logged for next meeting.</div>
              )}
            </div>
          </>
        ) : (
          <p className="muted">No upcoming meeting found.</p>
        )}
      </section>

      <section className="card stack">
        <h2 className="sectionTitle">Next 4 speaker slots</h2>
        {overdueSpeakers.length ? <Notice tone="error">{overdueSpeakers.length} speaker slot(s) still need confirmation or cover.</Notice> : null}
        <div className="list">
          {data.speakerWindow.map((speaker) => (
            <div key={speaker.id} className="listRow">
              <div className="appHeader">
                <div>
                  <div style={{ fontWeight: 700 }}>{formatMeetingDate(speaker.meeting.meetingDate)}</div>
                  <div>{speaker.member ? `${speaker.member.name} - ${speaker.member.businessName}` : "(Unassigned)"}</div>
                </div>
                <StatusPill status={speaker.status} />
              </div>
            </div>
          ))}
        </div>
        <Link className="secondaryButton" href="/rota?status=needs-action">
          Open rota items needing action
        </Link>
      </section>
    </AppShell>
  );
}
