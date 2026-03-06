import Link from "next/link";
import { StatusPill } from "@/components/StatusPill";
import { getHomeSpeakerData } from "@/lib/data";
import { formatMeetingDate } from "@/lib/time";

export async function HomeSpeaker({ memberId }: { memberId: string }) {
  const data = await getHomeSpeakerData(memberId);

  return (
    <section className="card stack">
      <h2 className="sectionTitle">Speaker</h2>
      {data.assignedSpeaker ? (
        <div className="listRow">
          <div style={{ fontWeight: 700 }}>{formatMeetingDate(data.assignedSpeaker.meeting.meetingDate)}</div>
          <div>{data.assignedSpeaker.member?.name} - {data.assignedSpeaker.member?.businessName}</div>
          <div className="muted smallText">
            Confirm by {formatMeetingDate(data.assignedSpeaker.deadline)}
            {data.assignedSpeaker.deadlinePassed ? " (cutoff passed)" : ""}
          </div>
          <div className="inlineActions">
            <Link className="primaryButton" href="/rota?my=1">
              Manage speaker slot
            </Link>
          </div>
        </div>
      ) : data.coverRequired ? (
        <div className="listRow">
          <StatusPill status={data.coverRequired.status} />
          <div style={{ fontWeight: 700 }}>Cover needed on {formatMeetingDate(data.coverRequired.meeting.meetingDate)}</div>
          <Link
            className="primaryButton"
            href={`https://wa.me/?text=${encodeURIComponent(
              `Cover required for BiiG on ${formatMeetingDate(data.coverRequired.meeting.meetingDate)}. ${data.coverRequired.member?.name ?? "Current speaker"} needs cover.`,
            )}`}
            target="_blank"
          >
            Share to WhatsApp
          </Link>
          <Link className="secondaryButton" href="/rota">
            Claim in rota
          </Link>
        </div>
      ) : (
        <p className="muted">No speaker action needed right now.</p>
      )}
    </section>
  );
}

export function HomeSpeakerFallback() {
  return (
    <section className="card stack">
      <h2 className="sectionTitle">Speaker</h2>
      <p className="muted">Loading speaker status...</p>
    </section>
  );
}
