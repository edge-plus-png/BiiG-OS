import Link from "next/link";
import { MemberRole, SpeakerStatus } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { StatusPill } from "@/components/StatusPill";
import {
  adminAssignSpeakerAction,
  adminToggleMeetingCancelledAction,
  updateSpeakerStatusAction,
} from "@/lib/actions";
import { requireMember } from "@/lib/auth";
import { getMembers, getRotaData } from "@/lib/data";

export default async function RotaPage({
  searchParams,
}: {
  searchParams: Promise<{ showCancelled?: string }>;
}) {
  const member = await requireMember();
  const [meetings, members, params] = await Promise.all([getRotaData(), getMembers(), searchParams]);
  const showCancelled = params.showCancelled === "1";

  return (
    <AppShell member={member}>
      <section className="card stack">
        <div className="appHeader">
          <div>
            <h1 className="sectionTitle">Speaker rota</h1>
            <p className="muted">Next 12 meetings. Cancelled weeks are hidden unless you choose to show them.</p>
          </div>
          <Link className="secondaryButton" href={showCancelled ? "/rota" : "/rota?showCancelled=1"}>
            {showCancelled ? "Hide cancelled" : "Show cancelled"}
          </Link>
        </div>
        <div className="list">
          {meetings
            .filter((meeting) => showCancelled || !meeting.isCancelled)
            .map((meeting) => (
              <div className="listRow" key={meeting.id} style={meeting.isCancelled ? { opacity: 0.6 } : undefined}>
                <div className="appHeader">
                  <div>
                    <div style={{ fontWeight: 800 }}>{meeting.displayDate}</div>
                    {meeting.speaker?.member ? (
                      <div>{meeting.speaker.member.name} - {meeting.speaker.member.businessName}</div>
                    ) : (
                      <div className="muted">(Unassigned)</div>
                    )}
                  </div>
                  {meeting.isCancelled ? (
                    <span className="chip">{meeting.cancelReason || "Cancelled"}</span>
                  ) : (
                    <StatusPill status={meeting.speaker?.status ?? SpeakerStatus.AWAITING} />
                  )}
                </div>

                {!meeting.isCancelled ? (
                  <div className="muted smallText">
                    Confirm by {meeting.cutoffLabel}
                    {meeting.deadlinePassed && meeting.speaker?.status !== SpeakerStatus.CONFIRMED ? " - cutoff passed" : ""}
                  </div>
                ) : null}

                {!meeting.isCancelled && meeting.speaker?.memberId === member.id ? (
                  <div className="inlineActions">
                    <form action={updateSpeakerStatusAction}>
                      <input type="hidden" name="speakerId" value={meeting.speaker.id} />
                      <input type="hidden" name="action" value="confirm" />
                      <button className="primaryButton" type="submit">
                        Confirm
                      </button>
                    </form>
                    <form action={updateSpeakerStatusAction}>
                      <input type="hidden" name="speakerId" value={meeting.speaker.id} />
                      <input type="hidden" name="action" value="cover" />
                      <button className="dangerButton" type="submit">
                        Cover required
                      </button>
                    </form>
                  </div>
                ) : null}

                {!meeting.isCancelled && meeting.speaker?.status === SpeakerStatus.COVER_REQUIRED ? (
                  <div className="inlineActions">
                    <form action={updateSpeakerStatusAction}>
                      <input type="hidden" name="speakerId" value={meeting.speaker.id} />
                      <input type="hidden" name="action" value="claim" />
                      <button className="primaryButton" type="submit">
                        I&apos;ll take it
                      </button>
                    </form>
                    <Link
                      className="secondaryButton"
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Cover required for BiiG on ${meeting.displayDate}. Reply if you can take it.`,
                      )}`}
                      target="_blank"
                    >
                      Share to WhatsApp
                    </Link>
                  </div>
                ) : null}

                {member.role === MemberRole.ADMIN ? (
                  <>
                    <form action={adminAssignSpeakerAction} className="formGrid">
                      <input type="hidden" name="meetingId" value={meeting.id} />
                      <label className="label">
                        Assign speaker
                        <select className="select" name="memberId" defaultValue={meeting.speaker?.memberId ?? ""}>
                          <option value="">Unassigned</option>
                          {members.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} - {item.businessName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="secondaryButton" type="submit">
                        Save speaker
                      </button>
                    </form>

                    <form action={adminToggleMeetingCancelledAction} className="formGrid">
                      <input type="hidden" name="meetingId" value={meeting.id} />
                      <label className="label">
                        Week status
                        <select className="select" name="isCancelled" defaultValue={meeting.isCancelled ? "true" : "false"}>
                          <option value="false">Active meeting</option>
                          <option value="true">Cancelled week</option>
                        </select>
                      </label>
                      <label className="label">
                        Cancel reason
                        <input className="input" name="cancelReason" defaultValue={meeting.cancelReason ?? ""} />
                      </label>
                      <button className="secondaryButton" type="submit">
                        Save week
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            ))}
        </div>
      </section>
    </AppShell>
  );
}
