# BiiG OS

Mobile-first weekly networking app for BiiG, built with Next.js App Router, Prisma, Postgres, PIN auth, and server-side schedule automation.

## Stack

- Next.js 15 App Router
- React 19
- Prisma + Postgres
- Zod validation
- Cookie sessions with 90-day expiry
- Vercel-ready deploy target

## Environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required variables:

- `DATABASE_URL`: Postgres connection string for Neon, Supabase, or equivalent
- `DIRECT_URL`: direct Postgres connection string for Prisma CLI and migrations when using Neon pooling
- `APP_URL`: local or deployed app URL
- `SESSION_SECRET`: long random secret used to hash session tokens
- `SEED_ADMIN_PIN`: optional seed PIN for the sample admin account

## Local setup

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Create the database schema:

```bash
npx prisma migrate dev --name init
```

If you are using Neon, set:

- `DATABASE_URL` to the pooled `-pooler` connection string for runtime
- `DIRECT_URL` to the direct non-pooler connection string for Prisma migrations and CLI commands

Seed starter members and upcoming meetings:

```bash
npm run db:seed
```

Start the app:

```bash
npm run dev
```

## Core behaviour

- Members are treated as attending by default.
- Non-attendance cutoff is Wednesday 18:00 London time before the Friday meeting.
- Speaker confirmation cutoff is Friday 18:00 London time one week before the meeting.
- The app auto-creates the next 12 Friday meetings and ensures speaker records exist for the next 4 upcoming non-cancelled meetings.
- That schedule routine runs server-side on the main member, rota, and admin pages, so v1 does not depend on cron.

## Seed data

The seed creates:

- 1 leadership user: `Alex Carter - Carter Financial`
- 2 member users
- next 12 Friday meetings
- starter speaker assignments for the next 4 active meetings

All seeded members use `SEED_ADMIN_PIN` or `1234` by default.

## Main routes

- `/login`: searchable member picker + PIN login
- `/`: member homepage and quick actions
- `/attendance/new`
- `/referrals/new`
- `/thank-you/new`
- `/one-to-ones/new`
- `/visitors/new`
- `/rota`: speaker rota and cover flow
- `/admin`: leadership dashboard
- `/admin/members`: onboarding and PIN reset
- `/admin/exports`: CSV exports

## Deployment

Deploy to Vercel with:

1. A Postgres database and `DATABASE_URL`
2. The other environment variables set in Vercel project settings
3. A Prisma migration applied to production

Suggested production release flow:

```bash
npx prisma migrate deploy
npm run build
```

## Validation

Validated locally with:

```bash
npx prisma generate
npx tsc --noEmit
npm run build
```
