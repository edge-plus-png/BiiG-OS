import { SpeakerStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getNextFridays } from "@/lib/time";

export async function ensureSchedule() {
  const nextFridays = getNextFridays(12);

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
}
