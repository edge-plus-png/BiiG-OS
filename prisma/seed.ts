import { addDays } from "date-fns";
import { MemberRole } from "@prisma/client";
import { hashPin } from "@/lib/pin";
import { prisma } from "@/lib/prisma";
import { getNextFridays } from "@/lib/time";

async function main() {
  const adminPin = process.env.SEED_ADMIN_PIN || "1234";
  const defaultPinHash = await hashPin(adminPin);

  const seedMembers = [
    {
      name: "Alex Carter",
      businessName: "Carter Financial",
      breakfastChoice: "Full English",
      role: MemberRole.ADMIN,
    },
    {
      name: "Priya Singh",
      businessName: "Singh Legal",
      breakfastChoice: "Vegetarian",
      role: MemberRole.MEMBER,
    },
    {
      name: "Tom Harris",
      businessName: "Harris Build",
      breakfastChoice: "No breakfast",
      role: MemberRole.MEMBER,
    },
  ];

  for (const member of seedMembers) {
    await prisma.member.upsert({
      where: { name_businessName: { name: member.name, businessName: member.businessName } },
      update: {},
      create: {
        ...member,
        pinHash: defaultPinHash,
      },
    });
  }

  for (const meetingDate of getNextFridays(12)) {
    await prisma.meeting.upsert({
      where: { meetingDate },
      update: {},
      create: { meetingDate },
    });
  }

  const members = await prisma.member.findMany({ orderBy: { name: "asc" } });
  const meetings = await prisma.meeting.findMany({
    where: { isCancelled: false, meetingDate: { gte: addDays(new Date(), -1) } },
    orderBy: { meetingDate: "asc" },
    take: 4,
  });

  for (const [index, meeting] of meetings.entries()) {
    await prisma.speaker.upsert({
      where: { meetingId: meeting.id },
      update: {},
      create: {
        meetingId: meeting.id,
        memberId: members[index % members.length]?.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
