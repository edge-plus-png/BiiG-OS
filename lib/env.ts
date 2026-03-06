import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  APP_URL: z.string().url(),
  SESSION_SECRET: z.string().min(16),
  SEED_ADMIN_PIN: z.string().min(4).optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  APP_URL: process.env.APP_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SEED_ADMIN_PIN: process.env.SEED_ADMIN_PIN,
});
