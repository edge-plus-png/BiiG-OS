import { randomBytes, createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MemberRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { hashPin, verifyPin } from "@/lib/pin";

const SESSION_COOKIE = "biig_session";
const SESSION_TTL_DAYS = 90;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BLOCK_MS = 30 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(`${token}:${env.SESSION_SECRET}`).digest("hex");
}

export async function createSession(memberId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      memberId,
      token,
      expiresAt,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token: hashToken(token) } });
  }

  store.delete(SESSION_COOKIE);
}

export async function getCurrentMember() {
  const store = await cookies();
  const rawToken = store.get(SESSION_COOKIE)?.value;

  if (!rawToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token: hashToken(rawToken) },
    include: { member: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    store.delete(SESSION_COOKIE);
    return null;
  }

  return session.member;
}

export async function requireMember() {
  const member = await getCurrentMember();
  if (!member) {
    redirect("/login");
  }
  return member;
}

export async function requireAdmin() {
  const member = await requireMember();
  if (member.role !== MemberRole.ADMIN) {
    redirect("/");
  }
  return member;
}

export async function assertLoginAllowed(key: string) {
  const attempt = await prisma.loginAttempt.findUnique({ where: { key } });
  const now = new Date();

  if (attempt?.blockedUntil && attempt.blockedUntil > now) {
    return {
      allowed: false,
      message: `Too many attempts. Try again after ${attempt.blockedUntil.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.`,
    };
  }

  if (!attempt || now.getTime() - attempt.windowStarted.getTime() > ATTEMPT_WINDOW_MS) {
    await prisma.loginAttempt.upsert({
      where: { key },
      create: { key, count: 0, windowStarted: now },
      update: { count: 0, windowStarted: now, blockedUntil: null },
    });
  }

  return { allowed: true, message: "" };
}

export async function registerFailedLogin(key: string) {
  const attempt = await prisma.loginAttempt.findUnique({ where: { key } });
  const now = new Date();
  const nextCount = (attempt?.count ?? 0) + 1;

  await prisma.loginAttempt.upsert({
    where: { key },
    create: {
      key,
      count: 1,
      windowStarted: now,
      blockedUntil: nextCount >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : null,
    },
    update: {
      count: nextCount,
      blockedUntil: nextCount >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : null,
    },
  });
}

export async function clearFailedLogins(key: string) {
  await prisma.loginAttempt.deleteMany({ where: { key } });
}
