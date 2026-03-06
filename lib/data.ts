import { Prisma, SpeakerStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureSchedule } from "@/lib/schedule";
import { formatMeetingDate, hasCutoffPassed, nonAttendanceCutoff, speakerConfirmCutoff } from "@/lib/time";

export async function getMembers() {
  return prisma.member.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function getNextMeeting() {
  await ensureSchedule();

  return prisma.meeting.findFirst({
    where: { meetingDate: { gte: new Date() }, isCancelled: false },
    orderBy: { meetingDate: "asc" },
  });
}

export async function getHomeData(memberId: string) {
  await ensureSchedule();

  const nextMeeting = await prisma.meeting.findFirst({
    where: { meetingDate: { gte: new Date() }, isCancelled: false },
    orderBy: { meetingDate: "asc" },
    include: {
      nonAttendance: { where: { memberId } },
      speaker: { include: { member: true } },
      visitors: true,
    },
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  yearStart.setHours(0, 0, 0, 0);

  const [monthReferralPassed, monthReferralReceived, monthThankYouReceived, monthVisitors, monthOneToOnes, yearReferralPassed, yearReferralReceived, yearThankYouReceived, yearVisitors, yearOneToOnes, assignedSpeaker, coverRequired] = await Promise.all([
    prisma.referral.count({
      where: { fromMemberId: memberId, createdAt: { gte: monthStart } },
    }),
    prisma.referral.count({
      where: { toMemberId: memberId, createdAt: { gte: monthStart } },
    }),
    prisma.thankYou.aggregate({
      where: { toMemberId: memberId, createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.visitor.count({
      where: { addedByMemberId: memberId, createdAt: { gte: monthStart } },
    }),
    prisma.oneToOne.count({
      where: {
        meetingDate: { gte: monthStart },
        OR: [{ memberLowId: memberId }, { memberHighId: memberId }],
      },
    }),
    prisma.referral.count({
      where: { fromMemberId: memberId, createdAt: { gte: yearStart } },
    }),
    prisma.referral.count({
      where: { toMemberId: memberId, createdAt: { gte: yearStart } },
    }),
    prisma.thankYou.aggregate({
      where: { toMemberId: memberId, createdAt: { gte: yearStart } },
      _sum: { amount: true },
    }),
    prisma.visitor.count({
      where: { addedByMemberId: memberId, createdAt: { gte: yearStart } },
    }),
    prisma.oneToOne.count({
      where: {
        meetingDate: { gte: yearStart },
        OR: [{ memberLowId: memberId }, { memberHighId: memberId }],
      },
    }),
    prisma.speaker.findFirst({
      where: {
        memberId,
        meeting: { meetingDate: { gte: new Date() }, isCancelled: false },
      },
      include: { meeting: true, member: true },
      orderBy: { meeting: { meetingDate: "asc" } },
    }),
    prisma.speaker.findFirst({
      where: {
        status: SpeakerStatus.COVER_REQUIRED,
        meeting: { meetingDate: { gte: new Date() }, isCancelled: false },
      },
      include: { meeting: true, member: true },
      orderBy: { meeting: { meetingDate: "asc" } },
    }),
  ]);

  return {
    nextMeeting,
    attendanceRecord: nextMeeting?.nonAttendance[0] ?? null,
    metrics: {
      monthToDate: {
        referralsPassed: monthReferralPassed,
        referralsReceived: monthReferralReceived,
        thankYouReceived: Number(monthThankYouReceived._sum.amount ?? 0),
        visitors: monthVisitors,
        oneToOnes: monthOneToOnes,
      },
      yearToDate: {
        referralsPassed: yearReferralPassed,
        referralsReceived: yearReferralReceived,
        thankYouReceived: Number(yearThankYouReceived._sum.amount ?? 0),
        visitors: yearVisitors,
        oneToOnes: yearOneToOnes,
      },
    },
    metricDefinitions: {
      referrals: "Referrals are split into passed and received.",
      thankYou: "Business shows thank-you received, not thank-you logged.",
      oneToOnes: "A single 1-2-1 entry gives both members credit.",
    },
    assignedSpeaker: assignedSpeaker
      ? {
          ...assignedSpeaker,
          deadline: speakerConfirmCutoff(assignedSpeaker.meeting.meetingDate),
          deadlinePassed: hasCutoffPassed(speakerConfirmCutoff(assignedSpeaker.meeting.meetingDate)),
        }
      : null,
    coverRequired: coverRequired
      ? {
          ...coverRequired,
          deadline: speakerConfirmCutoff(coverRequired.meeting.meetingDate),
        }
      : null,
  };
}

export async function getRotaData() {
  await ensureSchedule();

  const meetings = await prisma.meeting.findMany({
    where: { meetingDate: { gte: new Date() } },
    orderBy: { meetingDate: "asc" },
    take: 12,
    include: {
      speaker: { include: { member: true } },
    },
  });

  return meetings.map((meeting) => ({
    ...meeting,
    displayDate: formatMeetingDate(meeting.meetingDate),
    speakerDeadline: speakerConfirmCutoff(meeting.meetingDate),
    deadlinePassed: hasCutoffPassed(speakerConfirmCutoff(meeting.meetingDate)),
    cutoffLabel: formatMeetingDate(speakerConfirmCutoff(meeting.meetingDate)),
  }));
}

export async function getAdminDashboard() {
  await ensureSchedule();

  const nextMeeting = await prisma.meeting.findFirst({
    where: { meetingDate: { gte: new Date() }, isCancelled: false },
    orderBy: { meetingDate: "asc" },
    include: {
      nonAttendance: { include: { member: true } },
      visitors: true,
      speaker: { include: { member: true } },
    },
  });

  const speakerWindow = await prisma.speaker.findMany({
    where: { meeting: { meetingDate: { gte: new Date() }, isCancelled: false } },
    include: { meeting: true, member: true },
    orderBy: { meeting: { meetingDate: "asc" } },
    take: 4,
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  yearStart.setHours(0, 0, 0, 0);

  const [monthReferrals, monthThankYou, monthVisitors, monthOneToOnes, yearReferrals, yearThankYou, yearVisitors, yearOneToOnes] = await Promise.all([
    prisma.referral.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.thankYou.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.visitor.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.oneToOne.count({ where: { meetingDate: { gte: monthStart } } }),
    prisma.referral.count({ where: { createdAt: { gte: yearStart } } }),
    prisma.thankYou.aggregate({ where: { createdAt: { gte: yearStart } }, _sum: { amount: true } }),
    prisma.visitor.count({ where: { createdAt: { gte: yearStart } } }),
    prisma.oneToOne.count({ where: { meetingDate: { gte: yearStart } } }),
  ]);

  return {
    nextMeeting,
    speakerWindow,
    metrics: {
      monthToDate: {
        referrals: monthReferrals,
        thankYou: Number(monthThankYou._sum.amount ?? 0),
        visitors: monthVisitors,
        oneToOnes: monthOneToOnes,
      },
      yearToDate: {
        referrals: yearReferrals,
        thankYou: Number(yearThankYou._sum.amount ?? 0),
        visitors: yearVisitors,
        oneToOnes: yearOneToOnes,
      },
    },
  };
}

export async function getExportRows(range: { from?: Date; to?: Date }, type: string) {
  const createdAt = {
    gte: range.from,
    lte: range.to,
  };

  switch (type) {
    case "referrals":
      return prisma.referral.findMany({
        where: { createdAt },
        include: { fromMember: true, toMember: true, meeting: true },
        orderBy: { createdAt: "desc" },
      });
    case "thank_you":
      return prisma.thankYou.findMany({
        where: { createdAt },
        include: { fromMember: true, toMember: true, referral: true },
        orderBy: { createdAt: "desc" },
      });
    case "non_attendance":
      return prisma.nonAttendance.findMany({
        where: { createdAt },
        include: { member: true, meeting: true },
        orderBy: { createdAt: "desc" },
      });
    case "one_to_one":
      return prisma.oneToOne.findMany({
        where: { createdAt },
        include: { memberLow: true, memberHigh: true },
        orderBy: { createdAt: "desc" },
      });
    case "visitors":
      return prisma.visitor.findMany({
        where: { createdAt },
        include: { addedByMember: true, meeting: true },
        orderBy: { createdAt: "desc" },
      });
    case "monthly_summary":
      return prisma.$queryRaw<
        Array<{ month: Date; referrals: bigint; thank_you: Prisma.Decimal | null; visitors: bigint }>
      >`SELECT date_trunc('month', "createdAt") AS month,
          COUNT(*)::bigint AS referrals,
          (SELECT COALESCE(SUM("amount"), 0) FROM "ThankYou" t WHERE date_trunc('month', t."createdAt") = date_trunc('month', r."createdAt")) AS thank_you,
          (SELECT COUNT(*)::bigint FROM "Visitor" v WHERE date_trunc('month', v."createdAt") = date_trunc('month', r."createdAt")) AS visitors
        FROM "Referral" r
        WHERE (${range.from ?? null}::timestamp IS NULL OR r."createdAt" >= ${range.from ?? null})
          AND (${range.to ?? null}::timestamp IS NULL OR r."createdAt" <= ${range.to ?? null})
        GROUP BY 1
        ORDER BY 1 DESC`;
    default:
      return [];
  }
}
