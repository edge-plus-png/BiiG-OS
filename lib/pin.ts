import { randomBytes, pbkdf2 as pbkdf2Callback, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcryptjs";

const pbkdf2 = promisify(pbkdf2Callback);
const PBKDF2_PREFIX = "pbkdf2";
const PBKDF2_ITERATIONS = 120_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

function isLegacyBcryptHash(hash: string) {
  return hash.startsWith("$2");
}

export async function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await pbkdf2(pin, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST);
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${salt}$${derivedKey.toString("hex")}`;
}

async function verifyPbkdf2Pin(pin: string, hash: string) {
  const [prefix, iterationValue, salt, storedKey] = hash.split("$");

  if (prefix !== PBKDF2_PREFIX || !iterationValue || !salt || !storedKey) {
    return false;
  }

  const iterations = Number(iterationValue);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const derivedKey = await pbkdf2(pin, salt, iterations, KEY_LENGTH, DIGEST);
  return timingSafeEqual(Buffer.from(storedKey, "hex"), derivedKey);
}

export async function verifyPin(pin: string, hash: string) {
  if (isLegacyBcryptHash(hash)) {
    return bcrypt.compare(pin, hash);
  }

  return verifyPbkdf2Pin(pin, hash);
}

export async function verifyPinWithUpgrade(pin: string, hash: string) {
  const valid = await verifyPin(pin, hash);
  return {
    valid,
    needsUpgrade: valid && isLegacyBcryptHash(hash),
  };
}
