"use server";

import { randomInt } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MeetingType, MemberRole, Prisma, ReferralStatus, SpeakerStatus, VisitorLikelihood } from "@prisma/client";
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

function getSafeReturnPath(value?: string | null, fallback = "/admin/members") {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }
  return value;
}

function withQuery(path: string, key: string, value: string) {
  const url = new URL(path, "http://biig.local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

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

  redirect("/pin?saved=pin");
}

export async function updateOwnDetailsAction(formData: FormData) {
  const member = await requireMember();
  const parsed = z
    .object({
      name: z.string().min(1),
      businessName: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      breakfastChoice: z.string().optional(),
      dietaryNotes: z.string().optional(),
    })
    .parse({
      name: formData.get("name"),
      businessName: formData.get("businessName"),
      email: formData.get("email") || undefined,
      phone: formData.get("phone"),
      breakfastChoice: formData.get("breakfastChoice"),
      dietaryNotes: formData.get("dietaryNotes"),
    });

  await prisma.member.update({
    where: { id: member.id },
    data: {
      name: parsed.name,
      businessName: parsed.businessName,
      email: parsed.email || null,
      phone: parsed.phone || null,
      breakfastChoice: parsed.breakfastChoice || null,
      dietaryNotes: parsed.dietaryNotes || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/pin");
  redirect("/pin?saved=details");
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
      recipient: z.string().min(1).refine((value) => value.startsWith("member:"), {
        message: "Choose who the referral is for",
      }),
      leadName: z.string().min(1),
      leadContact: z.string().optional(),
      notes: z.string().optional(),
      meetingId: z.string().uuid().optional(),
    })
    .safeParse({
      recipient: formData.get("recipient"),
      leadName: formData.get("leadName"),
      leadContact: formData.get("leadContact"),
      notes: formData.get("notes"),
      meetingId: formData.get("meetingId") || undefined,
    });

  if (!parsed.success) {
    redirect("/referrals/new?error=Choose%20who%20the%20referral%20is%20for");
  }

  const recipient = parsed.data.recipient;
  const toMemberId = recipient.startsWith("member:") ? recipient.replace("member:", "") : undefined;

  await prisma.referral.create({
    data: {
      fromMemberId: member.id,
      toMemberId,
      leadName: parsed.data.leadName,
      leadContact: parsed.data.leadContact || null,
      notes: parsed.data.notes || null,
      meetingId: parsed.data.meetingId || null,
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
      recipient: z.string().min(1).refine((value) => value === "external:visitor" || value === "external:ex-member" || value.startsWith("member:"), {
        message: "Choose who the thank you is for",
      }),
      referralId: z.string().uuid().optional(),
      amount: z.coerce.number().positive(),
      notes: z.string().optional(),
    })
    .refine((data) => !data.referralId || data.recipient.startsWith("member:"), {
      message: "Referral linking only works when thanking a current member",
      path: ["referralId"],
    })
    .safeParse({
      recipient: formData.get("recipient"),
      referralId: formData.get("referralId") || undefined,
      amount: formData.get("amount"),
      notes: formData.get("notes"),
    });

  if (!parsed.success) {
    redirect("/thank-you/new?error=Choose%20who%20the%20thank%20you%20is%20for");
  }

  const recipient = parsed.data.recipient;
  const toMemberId = recipient.startsWith("member:") ? recipient.replace("member:", "") : undefined;
  const toExternalName = recipient === "external:visitor" ? "Visitor" : recipient === "external:ex-member" ? "Ex-member" : undefined;

  await prisma.$transaction(async (tx) => {
    if (parsed.data.referralId) {
      const referral = await tx.referral.findUnique({
        where: { id: parsed.data.referralId },
        select: { id: true, fromMemberId: true, toMemberId: true },
      });

      if (!referral || referral.fromMemberId !== toMemberId || referral.toMemberId !== member.id) {
        redirect("/thank-you/new?error=Only%20matching%20referrals%20for%20this%20member%20can%20be%20linked");
      }

      await tx.referral.update({
        where: { id: referral.id },
        data: { status: ReferralStatus.CONVERTED },
      });
    }

    await tx.thankYou.create({
      data: {
        fromMemberId: member.id,
        toMemberId,
        toExternalName,
        referralId: parsed.data.referralId || null,
        amount: parsed.data.amount,
        notes: parsed.data.notes || null,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/?saved=thankyou");
}

export async function updateOwnReferralStatusAction(formData: FormData) {
  const member = await requireMember();
  const parsed = z
    .object({
      referralId: z.string().uuid(),
      status: z.enum([ReferralStatus.GIVEN, ReferralStatus.LOST]),
    })
    .parse({
      referralId: formData.get("referralId"),
      status: formData.get("status"),
    });

  const referral = await prisma.referral.findUnique({
    where: { id: parsed.referralId },
    select: { id: true, toMemberId: true, status: true },
  });

  if (!referral || referral.toMemberId !== member.id) {
    redirect("/activity?error=Referral%20not%20found");
  }

  if (referral.status === ReferralStatus.CONVERTED) {
    redirect("/activity?error=Successful%20referrals%20should%20be%20changed%20via%20leadership");
  }

  await prisma.referral.update({
    where: { id: parsed.referralId },
    data: { status: parsed.status },
  });

  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/admin");
  redirect(withQuery("/activity", "saved", parsed.status === ReferralStatus.LOST ? "referral-lost" : "referral-live"));
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
    })
    .parse({
      meetingId: formData.get("meetingId"),
      visitorName: formData.get("visitorName"),
      visitorBusiness: formData.get("visitorBusiness"),
    });

  await prisma.visitor.create({
    data: {
      addedByMemberId: member.id,
      meetingId: parsed.meetingId,
      visitorName: parsed.visitorName,
      visitorBusiness: parsed.visitorBusiness || null,
      likelihood: VisitorLikelihood.HIGH,
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
      assignee: z.string(),
      note: z.string().optional(),
    })
    .parse({
      meetingId: formData.get("meetingId"),
      assignee: formData.get("assignee"),
      note: formData.get("note"),
    });

  const isNoMeeting = parsed.assignee === "__NONE__";
  const isInternalMeeting = parsed.assignee === "__INTERNAL__";
  const memberId = !parsed.assignee || isNoMeeting || isInternalMeeting ? null : z.string().uuid().parse(parsed.assignee);

  await prisma.$transaction(async (tx) => {
    await tx.meeting.update({
      where: { id: parsed.meetingId },
      data: {
        isCancelled: isNoMeeting,
        meetingType: isInternalMeeting ? MeetingType.INTERNAL : MeetingType.STANDARD,
        cancelReason: isNoMeeting || isInternalMeeting ? parsed.note || null : null,
      },
    });

    if (isNoMeeting || isInternalMeeting) {
      await tx.speaker.deleteMany({
        where: { meetingId: parsed.meetingId },
      });
      return;
    }

    await tx.speaker.upsert({
      where: { meetingId: parsed.meetingId },
      create: {
        meetingId: parsed.meetingId,
        memberId,
        assignedById: admin.id,
        status: SpeakerStatus.AWAITING,
      },
      update: {
        memberId,
        assignedById: admin.id,
        status: SpeakerStatus.AWAITING,
        confirmedAt: null,
      },
    });
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
    .safeParse({
      name: formData.get("name"),
      businessName: formData.get("businessName"),
      email: formData.get("email") || undefined,
      phone: formData.get("phone") || undefined,
      breakfastChoice: formData.get("breakfastChoice") || undefined,
      dietaryNotes: formData.get("dietaryNotes") || undefined,
      pin: formData.get("pin") || undefined,
      role: formData.get("role") || undefined,
    });

  if (!parsed.success) {
    redirect("/admin/members?error=Enter%20a%20name%20and%20business%20to%20create%20a%20member");
  }

  const pin = parsed.data.pin || `${randomInt(1000, 9999)}`;

  try {
    const member = await prisma.member.create({
      data: {
        name: parsed.data.name.trim(),
        businessName: parsed.data.businessName.trim(),
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        breakfastChoice: parsed.data.breakfastChoice || null,
        dietaryNotes: parsed.data.dietaryNotes || null,
        pinHash: await hashPin(pin),
        role: parsed.data.role ?? MemberRole.MEMBER,
      },
    });

    revalidatePath("/admin/members");
    redirect(`/admin/members?created=${member.id}&pin=${pin}`);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/admin/members?error=A%20member%20with%20that%20name%20and%20business%20already%20exists");
    }
    throw error;
  }
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

async function assertMemberManagementAllowed(adminId: string, memberId: string) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, role: true, isActive: true, name: true },
  });

  if (!member) {
    redirect("/admin/members?error=Member%20not%20found");
  }

  if (member.id === adminId) {
    redirect("/admin/members?error=You%20cannot%20change%20your%20own%20admin%20access%20here");
  }

  if (member.role === MemberRole.ADMIN && member.isActive) {
    const activeAdmins = await prisma.member.count({
      where: { role: MemberRole.ADMIN, isActive: true },
    });

    if (activeAdmins <= 1) {
      redirect("/admin/members?error=At%20least%20one%20active%20leader%20must%20remain");
    }
  }

  return member;
}

export async function updateMemberRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      memberId: z.string().uuid(),
      role: z.nativeEnum(MemberRole),
    })
    .parse({
      memberId: formData.get("memberId"),
      role: formData.get("role"),
    });

  const member = await prisma.member.findUnique({
    where: { id: parsed.memberId },
    select: { id: true, role: true, isActive: true },
  });

  if (!member) {
    redirect("/admin/members?error=Member%20not%20found");
  }

  if (member.id === admin.id) {
    redirect("/admin/members?error=Use%20a%20different%20leader%20account%20to%20change%20your%20own%20role");
  }

  if (member.role === MemberRole.ADMIN && member.isActive && parsed.role !== MemberRole.ADMIN) {
    const activeAdmins = await prisma.member.count({
      where: { role: MemberRole.ADMIN, isActive: true },
    });
    if (activeAdmins <= 1) {
      redirect("/admin/members?error=At%20least%20one%20active%20leader%20must%20remain");
    }
  }

  await prisma.member.update({
    where: { id: parsed.memberId },
    data: { role: parsed.role },
  });

  revalidatePath("/admin/members");
  redirect(`/admin/members?role=${parsed.memberId}`);
}

export async function toggleMemberArchivedAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      memberId: z.string().uuid(),
      archive: z.enum(["yes", "no"]),
    })
    .parse({
      memberId: formData.get("memberId"),
      archive: formData.get("archive"),
    });

  if (parsed.archive === "yes") {
    await assertMemberManagementAllowed(admin.id, parsed.memberId);
  }

  await prisma.member.update({
    where: { id: parsed.memberId },
    data: { isActive: parsed.archive !== "yes" },
  });

  if (parsed.archive === "yes") {
    await prisma.session.deleteMany({ where: { memberId: parsed.memberId } });
    await prisma.loginAttempt.deleteMany({ where: { key: `member:${parsed.memberId}` } });
  }

  revalidatePath("/admin/members");
  redirect(`/admin/members?${parsed.archive === "yes" ? "archived" : "restored"}=${parsed.memberId}`);
}

export async function deleteMemberAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = z
    .object({
      memberId: z.string().uuid(),
    })
    .parse({
      memberId: formData.get("memberId"),
    });

  const member = await assertMemberManagementAllowed(admin.id, parsed.memberId);

  const activityCounts = await prisma.$transaction([
    prisma.referral.count({ where: { OR: [{ fromMemberId: parsed.memberId }, { toMemberId: parsed.memberId }] } }),
    prisma.thankYou.count({ where: { OR: [{ fromMemberId: parsed.memberId }, { toMemberId: parsed.memberId }] } }),
    prisma.oneToOne.count({ where: { OR: [{ memberLowId: parsed.memberId }, { memberHighId: parsed.memberId }] } }),
    prisma.visitor.count({ where: { addedByMemberId: parsed.memberId } }),
    prisma.nonAttendance.count({ where: { memberId: parsed.memberId } }),
    prisma.speaker.count({ where: { OR: [{ memberId: parsed.memberId }, { assignedById: parsed.memberId }] } }),
    prisma.testimonial.count({ where: { OR: [{ fromMemberId: parsed.memberId }, { toMemberId: parsed.memberId }] } }),
    prisma.introduction.count({ where: { OR: [{ fromMemberId: parsed.memberId }, { toMemberId: parsed.memberId }] } }),
  ]);

  const hasLinkedHistory = activityCounts.some((count) => count > 0);
  if (hasLinkedHistory) {
    redirect(`/admin/members?error=${encodeURIComponent(`${member.name} has activity history and should be archived instead of deleted`)}`);
  }

  await prisma.member.delete({
    where: { id: parsed.memberId },
  });

  revalidatePath("/admin/members");
  redirect("/admin/members?deleted=1");
}

export async function updateReferralAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      referralId: z.string().uuid(),
      recipient: z.string().min(1).refine((value) => value.startsWith("member:"), {
        message: "Choose who the referral is for",
      }),
      leadName: z.string().min(1),
      leadContact: z.string().optional(),
      notes: z.string().optional(),
      status: z.nativeEnum(ReferralStatus),
      returnTo: z.string().optional(),
    })
    .parse({
      referralId: formData.get("referralId"),
      recipient: formData.get("recipient"),
      leadName: formData.get("leadName"),
      leadContact: formData.get("leadContact"),
      notes: formData.get("notes"),
      status: formData.get("status"),
      returnTo: formData.get("returnTo") || undefined,
    });

  const recipient = parsed.recipient;
  const toMemberId = recipient.startsWith("member:") ? recipient.replace("member:", "") : undefined;

  await prisma.referral.update({
    where: { id: parsed.referralId },
    data: {
      toMemberId,
      toExternalName: null,
      toExternalBusiness: null,
      leadName: parsed.leadName,
      leadContact: parsed.leadContact || null,
      notes: parsed.notes || null,
      status: parsed.status,
    },
  });

  const returnTo = getSafeReturnPath(parsed.returnTo, "/admin/members");
  revalidatePath(returnTo);
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/admin");
  redirect(withQuery(returnTo, "saved", "referral-updated"));
}

export async function deleteReferralAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      referralId: z.string().uuid(),
      returnTo: z.string().optional(),
    })
    .parse({
      referralId: formData.get("referralId"),
      returnTo: formData.get("returnTo") || undefined,
    });

  await prisma.referral.delete({
    where: { id: parsed.referralId },
  });

  const returnTo = getSafeReturnPath(parsed.returnTo, "/admin/members");
  revalidatePath(returnTo);
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/admin");
  redirect(withQuery(returnTo, "saved", "referral-deleted"));
}

export async function updateThankYouAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      thankYouId: z.string().uuid(),
      recipient: z.string().min(1).refine((value) => value === "external:visitor" || value === "external:ex-member" || value.startsWith("member:"), {
        message: "Choose who the thank you is for",
      }),
      amount: z.coerce.number().positive(),
      notes: z.string().optional(),
      returnTo: z.string().optional(),
    })
    .parse({
      thankYouId: formData.get("thankYouId"),
      recipient: formData.get("recipient"),
      amount: formData.get("amount"),
      notes: formData.get("notes"),
      returnTo: formData.get("returnTo") || undefined,
    });

  const recipient = parsed.recipient;
  const toMemberId = recipient.startsWith("member:") ? recipient.replace("member:", "") : undefined;
  const toExternalName = recipient === "external:visitor" ? "Visitor" : recipient === "external:ex-member" ? "Ex-member" : undefined;
  const existing = await prisma.thankYou.findUniqueOrThrow({
    where: { id: parsed.thankYouId },
    select: {
      id: true,
      fromMemberId: true,
      referralId: true,
    },
  });

  let nextReferralId: string | null = null;
  if (existing.referralId && toMemberId) {
    const referral = await prisma.referral.findUnique({
      where: { id: existing.referralId },
      select: { id: true, fromMemberId: true, toMemberId: true },
    });

    if (referral && referral.fromMemberId === toMemberId && referral.toMemberId === existing.fromMemberId) {
      nextReferralId = referral.id;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.thankYou.update({
      where: { id: parsed.thankYouId },
      data: {
        toMemberId,
        toExternalName,
        toExternalBusiness: null,
        referralId: nextReferralId,
        amount: parsed.amount,
        notes: parsed.notes || null,
      },
    });

    if (existing.referralId && existing.referralId !== nextReferralId) {
      const remainingLinks = await tx.thankYou.count({
        where: {
          referralId: existing.referralId,
          id: { not: existing.id },
        },
      });

      if (remainingLinks === 0) {
        await tx.referral.update({
          where: { id: existing.referralId },
          data: { status: ReferralStatus.GIVEN },
        });
      }
    }
  });

  const returnTo = getSafeReturnPath(parsed.returnTo, "/admin/members");
  revalidatePath(returnTo);
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/admin");
  redirect(withQuery(returnTo, "saved", "thankyou-updated"));
}

export async function deleteThankYouAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      thankYouId: z.string().uuid(),
      returnTo: z.string().optional(),
    })
    .parse({
      thankYouId: formData.get("thankYouId"),
      returnTo: formData.get("returnTo") || undefined,
    });

  const existing = await prisma.thankYou.findUniqueOrThrow({
    where: { id: parsed.thankYouId },
    select: { id: true, referralId: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.thankYou.delete({
      where: { id: parsed.thankYouId },
    });

    if (existing.referralId) {
      const remainingLinks = await tx.thankYou.count({
        where: { referralId: existing.referralId },
      });

      if (remainingLinks === 0) {
        await tx.referral.update({
          where: { id: existing.referralId },
          data: { status: ReferralStatus.GIVEN },
        });
      }
    }
  });

  const returnTo = getSafeReturnPath(parsed.returnTo, "/admin/members");
  revalidatePath(returnTo);
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/admin");
  redirect(withQuery(returnTo, "saved", "thankyou-deleted"));
}

export async function deleteOneToOneAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      oneToOneId: z.string().uuid(),
      returnTo: z.string().optional(),
    })
    .parse({
      oneToOneId: formData.get("oneToOneId"),
      returnTo: formData.get("returnTo") || undefined,
    });

  await prisma.oneToOne.delete({
    where: { id: parsed.oneToOneId },
  });

  const returnTo = getSafeReturnPath(parsed.returnTo, "/admin/members");
  revalidatePath(returnTo);
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/admin");
  redirect(withQuery(returnTo, "saved", "one-to-one-deleted"));
}

export async function deleteVisitorAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      visitorId: z.string().uuid(),
      returnTo: z.string().optional(),
    })
    .parse({
      visitorId: formData.get("visitorId"),
      returnTo: formData.get("returnTo") || undefined,
    });

  await prisma.visitor.delete({
    where: { id: parsed.visitorId },
  });

  const returnTo = getSafeReturnPath(parsed.returnTo, "/admin/members");
  revalidatePath(returnTo);
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/admin");
  redirect(withQuery(returnTo, "saved", "visitor-deleted"));
}

export async function deleteTestimonialAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      testimonialId: z.string().uuid(),
      returnTo: z.string().optional(),
    })
    .parse({
      testimonialId: formData.get("testimonialId"),
      returnTo: formData.get("returnTo") || undefined,
    });

  await prisma.testimonial.delete({
    where: { id: parsed.testimonialId },
  });

  const returnTo = getSafeReturnPath(parsed.returnTo, "/admin/members");
  revalidatePath(returnTo);
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/admin");
  redirect(withQuery(returnTo, "saved", "testimonial-deleted"));
}

export async function deleteIntroductionAction(formData: FormData) {
  await requireAdmin();
  const parsed = z
    .object({
      introductionId: z.string().uuid(),
      returnTo: z.string().optional(),
    })
    .parse({
      introductionId: formData.get("introductionId"),
      returnTo: formData.get("returnTo") || undefined,
    });

  await prisma.introduction.delete({
    where: { id: parsed.introductionId },
  });

  const returnTo = getSafeReturnPath(parsed.returnTo, "/admin/members");
  revalidatePath(returnTo);
  revalidatePath("/");
  revalidatePath("/activity");
  revalidatePath("/admin");
  redirect(withQuery(returnTo, "saved", "introduction-deleted"));
}
