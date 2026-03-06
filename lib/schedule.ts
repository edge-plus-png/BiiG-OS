import { SpeakerStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getNextFridays } from "@/lib/time";

const SCHEDULE_TTL_MS = 5 * 60 * 1000;
const globalForSchedule = globalThis as unknown as {
  ensureSchedulePromise?: Promise<void>;
  ensureScheduleLastRun?: number;
};

export async function ensureSchedule() {
  const now = Date.now();

  if (globalForSchedule.ensureScheduleLastRun && now - globalForSchedule.ensureScheduleLastRun < SCHEDULE_TTL_MS) {
    return;
  }

  if (globalForSchedule.ensureSchedulePromise) {
    return globalForSchedule.ensureSchedulePromise;
  }

  globalForSchedule.ensureSchedulePromise = (async () => {
    const nextFridays = getNextFridays(12);
    const latestRequiredMeeting = nextFridays[nextFridays.length - 1];
    const upcomingMeetings = await prisma.meeting.findMany({
      where: {
        meetingDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      orderBy: { meetingDate: "asc" },
      take: 12,
      select: {
        id: true,
        meetingDate: true,
        isCancelled: true,
        speaker: {
          select: { id: true },
        },
      },
    });

    const hasMeetingCoverage =
      upcomingMeetings.length >= 12 &&
      upcomingMeetings[upcomingMeetings.length - 1].meetingDate >= latestRequiredMeeting;
    const upcomingActiveMeetings = upcomingMeetings.filter((meeting) => !meeting.isCancelled).slice(0, 4);
    const hasSpeakerCoverage =
      upcomingActiveMeetings.length >= 4 &&
      upcomingActiveMeetings.every((meeting) => Boolean(meeting.speaker?.id));

    if (hasMeetingCoverage && hasSpeakerCoverage) {
      globalForSchedule.ensureScheduleLastRun = Date.now();
      return;
    }

    for (const meetingDate of nextFridays) {
      await prisma.meeting.upsert({
        where: { meetingDate },
        create: { meetingDate },
        update: {},
      });
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        meetingDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        isCancelled: false,
      },
      orderBy: { meetingDate: "asc" },
      take: 4,
    });

    for (const meeting of meetings) {
      await prisma.speaker.upsert({
        where: { meetingId: meeting.id },
        create: { meetingId: meeting.id, status: SpeakerStatus.AWAITING },
        update: {},
      });
    }

    globalForSchedule.ensureScheduleLastRun = Date.now();
  })();

  try {
    await globalForSchedule.ensureSchedulePromise;
  } finally {
    globalForSchedule.ensureSchedulePromise = undefined;
  }
}
