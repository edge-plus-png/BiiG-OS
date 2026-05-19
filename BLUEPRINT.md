# BiiG OS Blueprint

## 1. Purpose

BiiG OS is a mobile-first operational web app for a weekly Friday networking group.

The product is designed around one core principle:

- attendance is assumed by default
- members only log exceptions and meaningful activity

The app should feel fast, simple, and low-friction enough that members will actually use it every week from their phone.

## 2. Product Goals

### Primary goals

- Reduce weekly admin overhead for leadership
- Make member reporting fast enough to complete in seconds
- Keep group activity data trustworthy and reviewable
- Surface the next action on login rather than forcing members to hunt

### Success criteria

- Members can log the main weekly actions in under 10 seconds
- Leadership can review next-meeting status quickly
- Referrals, thank-yous, speaker slots, visitors, and attendance are auditable
- Members can self-review what they have given, received, and shared

## 3. Users And Permissions

### Member

Can:

- log in with name + PIN
- view homepage snapshot and next action
- log attendance exception, referral, thank-you, 1-2-1, visitor, testimonial, introduction
- view their own activity ledger
- review referrals passed to them
- update their own profile details and PIN
- manage their own speaker slot or claim cover if available

### Leadership / Admin

Can do everything a member can, plus:

- access leadership dashboard
- manage speaker rota
- onboard members
- reset PINs
- change member role
- archive / restore members
- delete members when they have no history
- export CSV data
- amend or delete key activity records to keep data clean

## 4. Core Product Model

The app tracks these weekly/member activities:

- Referrals
- Thank you for business
- 1-2-1s
- Visitors
- Testimonials
- Introductions
- Non-attendance
- Speaker rota

These should be understood like this:

- `Referral`: a concrete lead passed to another current member
- `Thank you`: value of business received, optionally linked to a matching member referral
- `1-2-1`: shared relationship activity, one entry credits both members
- `Visitor`: a guest brought into the room
- `Testimonial`: endorsement given by one member to another
- `Introduction`: useful connection made by one member to another

## 5. Core Product Rules

### Attendance

- Default state is attending
- Members only log non-attendance
- Non-attendance cutoff is Wednesday 18:00 Europe/London before the Friday meeting
- Late non-attendance is still allowed but flagged as late in leadership/admin views

### Speakers

- Speaker confirm cutoff is Friday one week before the meeting
- Homepage shows a member their next relevant speaker action
- Leadership can assign:
  - a member
  - `Unassigned`
  - `No meeting`
  - `Internal BiiG meeting`
- Standard meetings use speaker slots
- Internal BiiG meetings do not require a speaker
- No-meeting weeks are used for bank holidays or cancellations

### Referrals

- Referrals are member-to-member only
- Members can review referrals passed to them
- Referral statuses are:
  - `GIVEN` = live
  - `CONVERTED` = successful
  - `LOST` = not proceeding
- Thank-you creation can mark a linked referral as converted

### Thank you for business

- Thank-you records the value of business received by the person logging it
- Recipient options are:
  - current member
  - `Visitor`
  - `Ex-member`
- Referral linking only works for current members and only for matching referrals:
  - thanking `Tom` only shows referrals where `Tom -> current member`

### 1-2-1s

- One entry credits both members
- Duplicate pair entries for the same date are prevented using sorted member IDs

### Visitors

- Current UX keeps visitor logging lightweight
- Likelihood is still present in the schema as legacy structure, but the member flow no longer asks for it

### Testimonials and Introductions

- Logged primarily as activity given by the member creating them
- Both given and received are surfaced in the member snapshot/activity view
- Introduction `status` still exists in the database as a legacy field but is not used in the current UI

## 6. Homepage Experience

The homepage is the most important screen in the product.

It currently prioritises:

1. next Friday meeting status
2. compact month/year snapshot
3. referrals to review
4. quick action logging
5. speaker status
6. breakfast/details context

### Snapshot model

The snapshot is framed by direction:

- `Given`
- `Received`
- `Shared`

This aligns the numbers with how members think about contribution:

- Given: referrals passed, visitors brought, testimonials given, introductions made
- Received: referrals received, business received, testimonials received, introductions received
- Shared: 1-2-1s

### Referral review queue

Members now get a homepage card for live referrals passed to them.

They can mark:

- `Still live`
- `Not proceeding`

This is intentionally more prominent than hiding review only in the activity ledger.

## 7. Activity And Audit Model

The product has two layers of review:

### Member self-review

`/activity`

Members can review:

- referrals passed
- referrals received
- thank-yous logged
- thank-yous received
- 1-2-1 history
- visitors added
- testimonials given / received
- introductions made

Members can also update referral status for referrals passed to them.

### Leadership correction

Leadership can inspect a member activity ledger from admin and:

- edit referrals
- edit thank-yous
- delete duplicates or mistakes

Deletes now require confirmation before submission.

This keeps data clean without creating heavy admin workflow around every normal action.

## 8. Leadership Experience

### Leadership dashboard

`/admin`

Should answer:

- who is not attending next week
- who has provided subs
- which speaker slots need action
- who is visiting
- what the month and year look like

### Member administration

`/admin/members`

Leadership can:

- create members with minimal required data
- reveal or reset a PIN
- change role between member and leadership
- archive / restore members
- delete members with no linked history

The onboarding direction is intentionally light:

- leadership enters name and business
- members fill out the rest of their details later

## 9. Exports

CSV exports are available for:

- referrals
- thank-you
- non-attendance
- one-to-one
- visitors
- monthly summary

The exports are intended as a backup/reporting layer, not the main operational interface.

## 10. Authentication And Session Model

### Current login approach

- searchable member picker
- PIN entry
- rate-limited login
- session persistence around 90 days

### Implementation notes

- current auth uses a signed-cookie session path to reduce DB round trips
- legacy session table still exists and may be used as fallback/compatibility structure
- PINs are hashed and upgraded when older hashes are encountered

## 11. Scheduling And Automation

The app does not rely on cron for core behaviour.

On key page loads, server-side schedule routines ensure:

- next 12 Friday meetings exist
- next 4 upcoming standard speaker slots exist

Skipped correctly:

- cancelled weeks
- internal BiiG meeting weeks

## 12. Technology Stack

- Next.js App Router
- React
- Prisma
- Postgres (Neon in current deployment pattern)
- Zod validation
- Vercel deployment target

## 13. Current Route Map

### Member-facing

- `/login`
- `/`
- `/activity`
- `/pin`
- `/attendance/new`
- `/referrals/new`
- `/thank-you/new`
- `/one-to-ones/new`
- `/visitors/new`
- `/testimonials/new`
- `/introductions/new`
- `/rota`

### Leadership/admin

- `/admin`
- `/admin/members`
- `/admin/members/[memberId]`
- `/admin/referrals/[referralId]`
- `/admin/thank-you/[thankYouId]`
- `/admin/exports`
- `/admin/exports/[type]`

## 14. Current Data Model

Primary models:

- `Member`
- `Meeting`
- `Speaker`
- `NonAttendance`
- `Referral`
- `ThankYou`
- `OneToOne`
- `Visitor`
- `Testimonial`
- `Introduction`
- `Session`
- `LoginAttempt`

Important current constraints:

- `Member`: unique by `name + businessName`
- `Meeting`: unique by `meetingDate`
- `Speaker`: one speaker record per meeting
- `NonAttendance`: unique by `meetingId + memberId`
- `OneToOne`: unique by `meetingDate + memberLowId + memberHighId`

## 15. Known Implementation Notes

These are not blockers, but they are useful to keep explicit:

- `VisitorLikelihood` still exists in the schema although visitor UI no longer asks for it
- `Introduction.status` still exists in the schema but is not used by the current UI
- `Referral.toExternalName` / `toExternalBusiness` remain in the schema from an earlier iteration, but current product rules now treat referrals as member-only
- some legacy rows may still exist from earlier experiments and may need one-off data cleanup if they surface in reporting

## 16. Product Position For Next Phase

This implementation is now a strong v1 operating system for the group.

The next phase should not add random features. It should focus on one of:

- adoption polish
- operational reporting clarity
- leadership workflow refinement

Likely v1.1 candidates:

- cleaner member detail/profile UX
- audit notes for admin edits
- tighter reporting summaries by member and period
- one-off data cleanup for any legacy rows from earlier iterations

## 17. Product Principles To Preserve

If the product keeps evolving, these rules should stay intact:

- mobile-first first, desktop second
- no unnecessary data entry
- default attendance
- simple language over CRM language
- members self-serve wherever possible
- leadership only steps in where data quality matters
- home screen should always answer: what matters next, and what should I log now?
