"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MeetingType, MemberRole, SpeakerStatus, VisitorLikelihood } from "@prisma/client";
import { z } from "zod";
import {
  assertLoginAllowed,
  clearFailedLogins,
  createSession,
  destroySession,
  registerFailedLogin,
  requireAdmin,
  requireMember,
} from "@/lib/auth";
import { verifyPinWithUpgrade, hashPin } from "@/lib/pin";
import { prisma } from "@/lib/prisma";
import { nonAttendanceCutoff } from "@/lib/time";

const loginSchema = z.object({
  memberId: z.string().uuid(),
  pin: z.string().min(4).max(12),
});

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    memberId: formData.get("memberId"),
    pin: formData.get("pin"),
  });

  if (!parsed.success) {
    redirect("/login?error=Enter%20your%20name%20and%20PIN");
  }

  const key = `member:${parsed.data.memberId}`;
  const gate = await assertLoginAllowed(key);
  if (!gate.allowed) {
    redirect(`/login?error=${encodeURIComponent(gate.message)}`);
  }

  const member = await prisma.member.findUnique({ where: { id: parsed.data.memberId } });
  const verification = member ? await verifyPinWithUpgrade(parsed.data.pin, member.pinHash) : { valid: false, needsUpgrade: false };

  if (!member || !verification.valid) {
    await registerFailedLogin(key);
    redirect("/login?error=PIN%20not%20recognised");
  }

  if (verification.needsUpgrade) {
    await prisma.member.update({
      where: { id: member.id },
      data: { pinHash: await hashPin(parsed.data.pin) },
    });
  }

  await clearFailedLogins(key);
  await createSession(member.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function changeOwnPinAction(formData: FormData) {
  const member = await requireMember();
  const parsed = z
    .object({
      currentPin: z.string().min(4).max(12),
      newPin: z.string().min(4).max(12),
      confirmPin: z.string().min(4).max(12),
    })
    .parse({
      currentPin: formData.get("currentPin"),
      newPin: formData.get("newPin"),
      confirmPin: formData.get("confirmPin"),
    });

  if (parsed.newPin !== parsed.confirmPin) {
    redirect("/pin?error=New%20PIN%20entries%20must%20match");
  }

  const verification = await verifyPinWithUpgrade(parsed.currentPin, member.pinHash);
  if (!verification.valid) {
    redirect("/pin?error=Current%20PIN%20not%20recognised");
  }

  await prisma.member.update({
    where: { id: member.id },
    data: { pinHash: await hashPin(parsed.newPin) },
  });

  redirect("/pin?saved=1");
}

export async function saveNonAttendanceAction(formData: FormData) {
  const member = await requireMember();
  const parsed = z
    .object({
      meetingId: z.string().uuid(),
      hasSub: z.enum(["yes", "no"]),
      subName: z.string().optional(),
    })
    .parse({
      meetingId: formData.get("meetingId"),
      hasSub: formData.get("hasSub"),
      subName: formData.get("subName"),
    });

  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: parsed.meetingId } });
  const late = new Date() > nonAttendanceCutoff(meeting.meetingDate);

  await prisma.nonAttendance.upsert({
    where: {
      meetingId_memberId: {
        meetingId: parsed.meetingId,
        memberId: member.id,
      },
    },
    create: {
      meetingId: parsed.meetingId,
      memberId: member.id,
      hasSub: parsed.hasSub === "yes",
      subName: parsed.subName || null,
      createdLate: late,
    },
    update: {
      hasSub: parsed.hasSub === "yes",
      subName: parsed.subName || null,
      createdLate: late,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/?saved=attendance");
}

export async function saveReferralAction(formData: FormData) {
  const member = await requireMember();
  const parsed = z
    .object({
      toMemberId: z.string().uuid(),
      leadName: z.string().min(1),
      leadContact: z.string().optional(),
      notes: z.string().optional(),
      meetingId: z.string().uuid().optional(),
    })
    .parse({
      toMemberId: formData.get("toMemberId"),
      leadName: formData.get("leadName"),
      leadContact: formData.get("leadContact"),
      notes: formData.get("notes"),
      meetingId: formData.get("meetingId") || undefined,
    });

  await prisma.referral.create({
    data: {
      fromMemberId: member.id,
      toMemberId: parsed.toMemberId,
      leadName: parsed.leadName,
      leadContact: parsed.leadContact || null,
      notes: parsed.notes || null,
      meetingId: parsed.meetingId || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/?saved=referral");
}

export async function saveThankYouAction(formData: FormData) {
  const member = await requireMember();
  const parsed = z
    .object({
      toMemberId: z.string().uuid(),
      referralId: z.string().uuid().optional(),
      amount: z.coerce.number().positive(),
      notes: z.string().optional(),
    })
    .parse({
      toMemberId: formData.get("toMemberId"),
      referralId: formData.get("referralId") || undefined,
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });

  if (parsed.referralId) {
    const referral = await prisma.referral.findUnique({
      where: { id: parsed.referralId },
      select: { fromMemberId: true, toMemberId: true },
    });

    if (!referral || referral.fromMemberId !== parsed.toMemberId || referral.toMemberId !== member.id) {
      redirect("/thank-you/new?error=Only%20matching%20referrals%20for%20this%20member%20can%20be%20linked");
    }
  }

  await prisma.thankYou.create({
    data: {
      fromMemberId: member.id,
      toMemberId: parsed.toMemberId,
      referralId: parsed.referralId || null,
      amount: parsed.amount,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/?saved=thankyou");
}

export async function saveOneToOneAction(formData: FormData) {
  const member = await requireMember();
  const parsed = z
    .object({
      otherMemberId: z.string().uuid(),
      meetingDate: z.coerce.date(),
    })
    .parse({
      otherMemberId: formData.get("otherMemberId"),
      meetingDate: formData.get("meetingDate"),
    });

  const ids = [member.id, parsed.otherMemberId].sort();

  await prisma.oneToOne.upsert({
    where: {
      meetingDate_memberLowId_memberHighId: {
        meetingDate: parsed.meetingDate,
        memberLowId: ids[0],
        memberHighId: ids[1],
      },
    },
    create: {
      meetingDate: parsed.meetingDate,
      memberLowId: ids[0],
      memberHighId: ids[1],
    },
    update: {},
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/?saved=121");
}

export async function saveVisitorAction(formData: FormData) {
  const member = await requireMember();
  const parsed = z
    .object({
      meetingId: z.string().uuid(),
      visitorName: z.string().min(1),
      visitorBusiness: z.string().optional(),
      likelihood: z.nativeEnum(VisitorLikelihood),
    })
    .parse({
      meetingId: formData.get("meetingId"),
      visitorName: formData.get("visitorName"),
      visitorBusiness: formData.get("visitorBusiness"),
      likelihood: formData.get("likelihood"),
    });

  await prisma.visitor.create({
    data: {
      addedByMemberId: member.id,
      meetingId: parsed.meetingId,
      visitorName: parsed.visitorName,
      visitorBusiness: parsed.visitorBusiness || null,
      likelihood: parsed.likelihood,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/?saved=visitor");
}

export async function saveTestimonialAction(formData: FormData) {
  const member = await requireMember();
  const parsed = z
    .object({
      toMemberId: z.string().uuid(),
      notes: z.string().optional(),
    })
    .parse({
      toMemberId: formData.get("toMemberId"),
      notes: formData.get("notes"),
    });

  await prisma.testimonial.create({
    data: {
      fromMemberId: member.id,
      toMemberId: parsed.toMemberId,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/?saved=testimonial");
}

export async function saveIntroductionAction(formData: FormData) {
  const member = await requireMember();
  const parsed = z
    .object({
      toMemberId: z.string().uuid(),
      contactName: z.string().min(1),
      contactCompany: z.string().optional(),
      notes: z.string().optional(),
    })
    .parse({
      toMemberId: formData.get("toMemberId"),
      contactName: formData.get("contactName"),
      contactCompany: formData.get("contactCompany"),
      notes: formData.get("notes"),
    });

  await prisma.introduction.create({
    data: {
      fromMemberId: member.id,
      toMemberId: parsed.toMemberId,
      contactName: parsed.contactName,
      contactCompany: parsed.contactCompany || null,
      notes: parsed.notes || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/?saved=introduction");
}

export async function updateSpeakerStatusAction(formData: FormData) {
  const member = await requireMember();
  const parsed = z
    .object({
      speakerId: z.string().uuid(),
      action: z.enum(["confirm", "cover", "claim"]),
    })
    .parse({
      speakerId: formData.get("speakerId"),
      action: formData.get("action"),
    });

  const speaker = await prisma.speaker.findUniqueOrThrow({
    where: { id: parsed.speakerId },
    include: { meeting: true },
  });

  if (parsed.action === "claim") {
    await prisma.speaker.update({
      where: { id: parsed.speakerId },
      data: {
        memberId: member.id,
        status: SpeakerStatus.CONFIRMED,
        assignedById: member.id,
        confirmedAt: new Date(),
      },
    });
  } else {
    if (speaker.memberId !== member.id) {
      redirect("/rota?error=Only%20the%20assigned%20speaker%20can%20do%20that");
    }

    await prisma.speaker.update({
      where: { id: parsed.speakerId },
      data: {
        status: parsed.action === "confirm" ? SpeakerStatus.CONFIRMED : SpeakerStatus.COVER_REQUIRED,
        confirmedAt: parsed.action === "confirm" ? new Date() : null,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/rota");
  revalidatePath("/admin");
  redirect("/rota?saved=speaker");
}

export async function adminAssignSpeakerAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      meetingId: z.string().uuid(),
      memberId: z.string().uuid().optional(),
    })
    .parse({
      meetingId: formData.get("meetingId"),
      memberId: formData.get("memberId") || undefined,
    });

  const meeting = await prisma.meeting.findUniqueOrThrow({
    where: { id: parsed.meetingId },
    select: { isCancelled: true, meetingType: true },
  });

  if (meeting.isCancelled || meeting.meetingType !== MeetingType.STANDARD) {
    redirect("/rota?error=Speakers%20can%20only%20be%20assigned%20to%20standard%20meeting%20weeks");
  }

  await prisma.speaker.upsert({
    where: { meetingId: parsed.meetingId },
    create: {
      meetingId: parsed.meetingId,
      memberId: parsed.memberId ?? null,
      assignedById: admin.id,
      status: parsed.memberId ? SpeakerStatus.AWAITING : SpeakerStatus.AWAITING,
    },
    update: {
      memberId: parsed.memberId ?? null,
      assignedById: admin.id,
      status: parsed.memberId ? SpeakerStatus.AWAITING : SpeakerStatus.AWAITING,
      confirmedAt: null,
    },
  });

  revalidatePath("/rota");
  revalidatePath("/admin");
  redirect("/rota?saved=assigned");
}

export async function adminToggleMeetingCancelledAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      meetingId: z.string().uuid(),
      weekMode: z.enum(["standard", "internal", "none"]),
      cancelReason: z.string().optional(),
    })
    .parse({
      meetingId: formData.get("meetingId"),
      weekMode: formData.get("weekMode"),
      cancelReason: formData.get("cancelReason"),
    });

  await prisma.$transaction(async (tx) => {
    const isCancelled = parsed.weekMode === "none";
    const meetingType = parsed.weekMode === "internal" ? MeetingType.INTERNAL : MeetingType.STANDARD;

    await tx.meeting.update({
      where: { id: parsed.meetingId },
      data: {
        isCancelled,
        meetingType,
        cancelReason: parsed.weekMode !== "standard" ? parsed.cancelReason || null : null,
      },
    });

    if (parsed.weekMode === "standard") {
      await tx.speaker.upsert({
        where: { meetingId: parsed.meetingId },
        create: {
          meetingId: parsed.meetingId,
          assignedById: admin.id,
          status: SpeakerStatus.AWAITING,
        },
        update: {},
      });
      return;
    }

    await tx.speaker.deleteMany({
      where: { meetingId: parsed.meetingId },
    });
  });

  revalidatePath("/rota");
  revalidatePath("/admin");
  redirect("/rota?saved=meeting");
}

export async function createMemberAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().min(1),
      businessName: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      breakfastChoice: z.string().optional(),
      dietaryNotes: z.string().optional(),
      pin: z.string().min(4).max(12).optional(),
      role: z.nativeEnum(MemberRole).optional(),
    })
    .parse({
      name: formData.get("name"),
      businessName: formData.get("businessName"),
      email: formData.get("email") || undefined,
      phone: formData.get("phone"),
      breakfastChoice: formData.get("breakfastChoice"),
      dietaryNotes: formData.get("dietaryNotes"),
      pin: formData.get("pin") || undefined,
      role: formData.get("role") || undefined,
    });

  const pin = parsed.pin || `${randomInt(1000, 9999)}`;
  const member = await prisma.member.create({
    data: {
      name: parsed.name,
      businessName: parsed.businessName,
      email: parsed.email || null,
      phone: parsed.phone || null,
      breakfastChoice: parsed.breakfastChoice || null,
      dietaryNotes: parsed.dietaryNotes || null,
      pinHash: await hashPin(pin),
      role: parsed.role ?? MemberRole.MEMBER,
    },
  });

  revalidatePath("/admin/members");
  redirect(`/admin/members?created=${member.id}&pin=${pin}`);
}

export async function resetPinAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      memberId: z.string().uuid(),
      pin: z.string().min(4).max(12).optional(),
    })
    .parse({
      memberId: formData.get("memberId"),
      pin: formData.get("pin") || undefined,
    });

  const pin = parsed.pin || `${randomInt(1000, 9999)}`;
  await prisma.member.update({
    where: { id: parsed.memberId },
    data: { pinHash: await hashPin(pin) },
  });

  revalidatePath("/admin/members");
  redirect(`/admin/members?reset=${parsed.memberId}&pin=${pin}`);
}
