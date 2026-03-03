import { AppShell } from "@/components/AppShell";
import { requireMember } from "@/lib/auth";
import { saveNonAttendanceAction } from "@/lib/actions";
import { getNextMeeting } from "@/lib/data";
import { formatMeetingDate, hasCutoffPassed, nonAttendanceCutoff } from "@/lib/time";

export default async function NewAttendancePage() {
  const member = await requireMember();
  const nextMeeting = await getNextMeeting();

  if (!nextMeeting) {
    return <AppShell member={member}>No upcoming meeting found.</AppShell>;
  }

  const cutoff = nonAttendanceCutoff(nextMeeting.meetingDate);
  const late = hasCutoffPassed(cutoff);

  return (
    <AppShell member={member}>
      <section className="card stack">
        <h1 className="sectionTitle">Not attending</h1>
        <p className="muted">
          Meeting: {formatMeetingDate(nextMeeting.meetingDate)}. Cutoff: Wednesday 18:00 London time.
        </p>
        {late ? <div className="dangerButton smallText">This will be marked late in admin.</div> : null}
        <form action={saveNonAttendanceAction} className="formGrid">
          <input type="hidden" name="meetingId" value={nextMeeting.id} />
          <label className="label">
            Sub provided?
            <select className="select" name="hasSub" defaultValue="no">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
          <label className="label">
            Sub name
            <input className="input" name="subName" placeholder="Optional" />
          </label>
          <button className="dangerButton" type="submit">
            Save non-attendance
          </button>
        </form>
      </section>
    </AppShell>
  );
}
