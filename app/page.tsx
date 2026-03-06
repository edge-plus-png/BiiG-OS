import Link from "next/link";
import { CalendarX2, HandCoins, MessageSquareShare, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Notice } from "@/components/Notice";
import { StatusPill } from "@/components/StatusPill";
import { requireMember } from "@/lib/auth";
import { getHomeData } from "@/lib/data";
import { currency } from "@/lib/utils";
import { formatMeetingDate } from "@/lib/time";

const savedMessages: Record<string, string> = {
  attendance: "Non-attendance saved.",
  referral: "Referral saved.",
  thankyou: "Thank you saved.",
  "121": "1-2-1 saved.",
  visitor: "Visitor saved.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const member = await requireMember();
  const [data, params] = await Promise.all([getHomeData(member.id), searchParams]);

  return (
    <AppShell member={member}>
      {params.saved && savedMessages[params.saved] ? <Notice tone="success">{savedMessages[params.saved]}</Notice> : null}
      {data.nextMeeting ? (
        <section className="card stack">
          <div>
            <h1 className="sectionTitle">Next meeting</h1>
            <div style={{ fontSize: "1.35rem", fontWeight: 800 }}>{formatMeetingDate(data.nextMeeting.meetingDate)}</div>
          </div>
          <div className="inlineActions">
            {data.attendanceRecord ? (
              <>
                <StatusPill late={data.attendanceRecord.createdLate} />
                <span className="muted smallText">
                  Not attending{data.attendanceRecord.hasSub ? `, sub: ${data.attendanceRecord.subName || "Yes"}` : ""}
                </span>
              </>
            ) : (
              <span className="chip">Attending (default)</span>
            )}
          </div>
        </section>
      ) : null}

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
        </div>
        <p className="muted smallText" style={{ marginTop: 12 }}>
          One 1-2-1 entry counts for both members. Referrals are split into passed and received.
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
        </div>
      </section>

      <section className="stack">
        <Link className="dangerButton" href="/attendance/new">
          <CalendarX2 size={20} />
          Not attending
        </Link>
        <Link className="primaryButton" href="/referrals/new">
          <MessageSquareShare size={20} />
          Pass a referral
        </Link>
        <Link className="primaryButton" href="/thank-you/new">
          <HandCoins size={20} />
          Thank you for the business
        </Link>
        <Link className="primaryButton" href="/one-to-ones/new">
          <Users size={20} />
          Log a 1-2-1
        </Link>
        <Link className="primaryButton" href="/visitors/new">
          <UserPlus size={20} />
          Add a visitor
        </Link>
      </section>

      <section className="card stack">
        <h2 className="sectionTitle">Speaker</h2>
        {data.assignedSpeaker ? (
          <div className="listRow">
            <div style={{ fontWeight: 700 }}>{formatMeetingDate(data.assignedSpeaker.meeting.meetingDate)}</div>
            <div>{data.assignedSpeaker.member?.name} - {data.assignedSpeaker.member?.businessName}</div>
            <div className="muted smallText">
              Confirm by {formatMeetingDate(data.assignedSpeaker.deadline)}
              {data.assignedSpeaker.deadlinePassed ? " (cutoff passed)" : ""}
            </div>
            <div className="inlineActions">
              <Link className="primaryButton" href="/rota?my=1">
                Manage speaker slot
              </Link>
            </div>
          </div>
        ) : data.coverRequired ? (
          <div className="listRow">
            <StatusPill status={data.coverRequired.status} />
            <div style={{ fontWeight: 700 }}>Cover needed on {formatMeetingDate(data.coverRequired.meeting.meetingDate)}</div>
            <Link
              className="primaryButton"
              href={`https://wa.me/?text=${encodeURIComponent(
                `Cover required for BiiG on ${formatMeetingDate(data.coverRequired.meeting.meetingDate)}. ${data.coverRequired.member?.name ?? "Current speaker"} needs cover.`,
              )}`}
              target="_blank"
            >
              Share to WhatsApp
            </Link>
            <Link className="secondaryButton" href="/rota">
              Claim in rota
            </Link>
          </div>
        ) : (
          <p className="muted">No speaker action needed right now.</p>
        )}
      </section>

      <section className="card stack">
        <h2 className="sectionTitle">Breakfast</h2>
        <div>{member.breakfastChoice || "Not set"}</div>
        {member.dietaryNotes ? <div className="muted smallText">{member.dietaryNotes}</div> : null}
      </section>
    </AppShell>
  );
}
