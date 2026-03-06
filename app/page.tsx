import { Suspense } from "react";
import Link from "next/link";
import { CalendarX2, HandCoins, MessageSquareShare, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HomeMetrics, HomeMetricsFallback } from "@/components/home/HomeMetrics";
import { HomeSpeaker, HomeSpeakerFallback } from "@/components/home/HomeSpeaker";
import { Notice } from "@/components/Notice";
import { StatusPill } from "@/components/StatusPill";
import { requireMember } from "@/lib/auth";
import { getHomeHeaderData } from "@/lib/data";
import { createTiming } from "@/lib/timing";
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
  const timing = createTiming("home-page");
  const member = await requireMember();
  timing.mark("member");
  const [data, params] = await Promise.all([getHomeHeaderData(member.id), searchParams]);
  timing.done();

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

      <Suspense fallback={<HomeMetricsFallback />}>
        <HomeMetrics memberId={member.id} />
      </Suspense>

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

      <Suspense fallback={<HomeSpeakerFallback />}>
        <HomeSpeaker memberId={member.id} />
      </Suspense>

      <section className="card stack">
        <h2 className="sectionTitle">Breakfast</h2>
        <div>{member.breakfastChoice || "Not set"}</div>
        {member.dietaryNotes ? <div className="muted smallText">{member.dietaryNotes}</div> : null}
      </section>
    </AppShell>
  );
}
