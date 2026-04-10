import { Suspense } from "react";
import Link from "next/link";
import { CalendarX2, HandCoins, Link2, MessageSquareShare, Quote, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HomeMetrics, HomeMetricsFallback } from "@/components/home/HomeMetrics";
import { HomeReferralReview, HomeReferralReviewFallback } from "@/components/home/HomeReferralReview";
import { HomeSpeaker, HomeSpeakerFallback } from "@/components/home/HomeSpeaker";
import { Notice } from "@/components/Notice";
import { StatusPill } from "@/components/StatusPill";
import { requireMember } from "@/lib/auth";
import { getHomeHeaderData } from "@/lib/data";
import { formatMeetingDate } from "@/lib/time";

const savedMessages: Record<string, string> = {
  attendance: "Non-attendance saved.",
  referral: "Referral saved.",
  "referral-live": "Referral kept live.",
  "referral-lost": "Referral marked as not proceeding.",
  thankyou: "Thank you saved.",
  "121": "1-2-1 saved.",
  visitor: "Visitor saved.",
  testimonial: "Testimonial saved.",
  introduction: "Introduction saved.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const member = await requireMember();
  const [data, params] = await Promise.all([getHomeHeaderData(member.id), searchParams]);
  const actionCards = [
    {
      href: "/attendance/new",
      title: "Not attending",
      description: "Apology or sub",
      icon: CalendarX2,
      tone: "danger",
    },
    {
      href: "/referrals/new",
      title: "Pass a referral",
      description: "New lead",
      icon: MessageSquareShare,
      tone: "primary",
    },
    {
      href: "/thank-you/new",
      title: "Thank you for business",
      description: "Business received",
      icon: HandCoins,
      tone: "primary",
    },
    {
      href: "/one-to-ones/new",
      title: "Log a 1-2-1",
      description: "Meeting logged",
      icon: Users,
      tone: "secondary",
    },
    {
      href: "/visitors/new",
      title: "Add a visitor",
      description: "Expected guest",
      icon: UserPlus,
      tone: "secondary",
    },
    {
      href: "/testimonials/new",
      title: "Give a testimonial",
      description: "Backing given",
      icon: Quote,
      tone: "secondary",
    },
    {
      href: "/introductions/new",
      title: "Make an introduction",
      description: "Useful contact",
      icon: Link2,
      tone: "secondary",
    },
  ] as const;

  return (
    <AppShell member={member}>
      {params.saved && savedMessages[params.saved] ? <Notice tone="success">{savedMessages[params.saved]}</Notice> : null}
      {params.error ? <Notice tone="error">{params.error}</Notice> : null}
      {data.nextMeeting ? (
        <section className="card heroCard stack">
          <div className="heroHeader">
            <div>
              <p className="heroEyebrow">Friday meeting</p>
              <h1 className="heroTitle">{formatMeetingDate(data.nextMeeting.meetingDate)}</h1>
            </div>
            {data.attendanceRecord ? (
              <div className="heroStatus">
                <StatusPill late={data.attendanceRecord.createdLate} />
                <span className="muted smallText">
                  Not attending{data.attendanceRecord.hasSub ? `, sub: ${data.attendanceRecord.subName || "Yes"}` : ""}
                </span>
              </div>
            ) : (
              <div className="heroStatus">
                <span className="chip">Attending (default)</span>
                <span className="muted smallText">No action needed unless plans change.</span>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <Suspense fallback={<HomeMetricsFallback />}>
        <HomeMetrics memberId={member.id} />
      </Suspense>

      <Suspense fallback={<HomeReferralReviewFallback />}>
        <HomeReferralReview memberId={member.id} />
      </Suspense>

      <section className="card stack">
        <div>
          <h2 className="sectionTitle">Log something</h2>
          <p className="muted smallText">Quickest path to capture this week&apos;s activity.</p>
        </div>
        <div className="actionGrid">
          {actionCards.map((action) => {
            const Icon = action.icon;

            return (
              <Link key={action.href} className={`actionCard actionCard${action.tone[0].toUpperCase()}${action.tone.slice(1)}`} href={action.href}>
                <span className="actionIconWrap">
                  <Icon size={20} />
                </span>
                <span className="actionCopy">
                  <span className="actionTitle">{action.title}</span>
                  <span className="actionDescription">{action.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid2 homeFooterGrid">
        <Suspense fallback={<HomeSpeakerFallback />}>
          <HomeSpeaker memberId={member.id} />
        </Suspense>

        <section className="card stack breakfastCard">
          <h2 className="sectionTitle">Breakfast</h2>
          <div>{member.breakfastChoice || "Not set"}</div>
          {member.dietaryNotes ? <div className="muted smallText">{member.dietaryNotes}</div> : null}
        </section>
      </div>
    </AppShell>
  );
}
