import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import {
  deleteIntroductionAction,
  deleteOneToOneAction,
  deleteReferralAction,
  deleteTestimonialAction,
  deleteThankYouAction,
  deleteVisitorAction,
  updateOwnReferralStatusAction,
} from "@/lib/actions";
import { currency } from "@/lib/utils";

type MemberActivityData = Awaited<ReturnType<typeof import("@/lib/data").getMemberActivityData>>;
type ActivityType = "all" | "referrals" | "thank-you" | "one-to-ones" | "visitors" | "testimonials" | "introductions";

export function MemberActivityView({
  data,
  heading,
  backHref,
  backLabel,
  helperText,
  filterAction,
  selectedType = "all",
  memberCanReviewReferrals = false,
  adminManagePath,
}: {
  data: MemberActivityData;
  heading: string;
  backHref?: string;
  backLabel?: string;
  helperText?: string;
  filterAction: string;
  selectedType?: ActivityType;
  memberCanReviewReferrals?: boolean;
  adminManagePath?: string;
}) {
  const show = (type: Exclude<ActivityType, "all">) => selectedType === "all" || selectedType === type;

  return (
    <div className="stack">
      <section className="card stack">
        {backHref && backLabel ? (
          <Link href={backHref} className="inlineLink">
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
        ) : null}
        <div>
          <h1 className="sectionTitle">{heading}</h1>
          <div className="activityMemberLine" style={{ fontWeight: 700 }}>
            {data.member.name} - {data.member.businessName}
          </div>
          {helperText ? <p className="muted smallText">{helperText}</p> : null}
        </div>
        <form action={filterAction} className="formGrid">
          <div className="grid2">
            <label className="label">
              From
              <input className="input" type="date" name="from" defaultValue={formatDateInput(data.filters.from)} />
            </label>
            <label className="label">
              To
              <input className="input" type="date" name="to" defaultValue={formatDateInput(data.filters.to)} />
            </label>
          </div>
          <label className="label">
            Activity type
            <select className="select" name="type" defaultValue={selectedType}>
              <option value="all">All activity</option>
              <option value="referrals">Referrals</option>
              <option value="thank-you">Thank yous</option>
              <option value="one-to-ones">1-2-1s</option>
              <option value="visitors">Visitors</option>
              <option value="testimonials">Testimonials</option>
              <option value="introductions">Introductions</option>
            </select>
          </label>
          <div className="inlineActions activityFilterActions">
            <button className="secondaryButton" type="submit">
              Apply filters
            </button>
            <Link href={filterAction} className="secondaryButton">
              Clear
            </Link>
          </div>
        </form>
        <div className="metricRow activitySummaryRow">
          <div className="metricCard">
            <span className="muted smallText">Referrals passed</span>
            <span className="metricValue">{data.summary.referralsPassed}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Referrals received</span>
            <span className="metricValue">{data.summary.referralsReceived}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">Business received</span>
            <span className="metricValue">{currency(data.summary.businessReceived)}</span>
          </div>
          <div className="metricCard">
            <span className="muted smallText">1-2-1s</span>
            <span className="metricValue">{data.summary.oneToOnes}</span>
          </div>
        </div>
      </section>

      <section className="card stack">
        <h2 className="sectionTitle">Given</h2>
        <p className="muted smallText">What this member has logged or passed on to others.</p>
        {show("referrals") ? (
          <ActivityList
            title="Referrals passed"
            empty="No referrals passed yet."
            items={data.referralsGiven.map((item) => ({
              id: item.id,
              when: item.createdAt,
              title: `${item.counterparty.name} - ${item.leadName}`,
              detail: item.notes || item.leadContact || item.counterparty.businessName,
              badge: referralStatusLabel(item.status),
              badgeTone: referralStatusTone(item.status),
              actions: adminManagePath ? (
                <>
                  <Link
                    href={`/admin/referrals/${item.id}?from=${encodeURIComponent(adminManagePath)}`}
                    className="secondaryButton compactButton"
                  >
                    Edit
                  </Link>
                  <form action={deleteReferralAction} className="inlineActionForm">
                    <input type="hidden" name="referralId" value={item.id} />
                    <input type="hidden" name="returnTo" value={adminManagePath} />
                    <button className="dangerButton compactButton" type="submit">
                      Delete
                    </button>
                  </form>
                </>
              ) : undefined,
            }))}
          />
        ) : null}
        {show("thank-you") ? (
          <ActivityList
            title="Thank yous logged"
            empty="No thank yous logged yet."
            items={data.thankYousLogged.map((item) => ({
              id: item.id,
              when: item.createdAt,
              title: `${item.counterparty.name} - ${currency(Number(item.amount))}`,
              detail: item.referral?.leadName ? `Referral: ${item.referral.leadName}` : item.notes || item.counterparty.businessName,
              actions: adminManagePath ? (
                <>
                  <Link
                    href={`/admin/thank-you/${item.id}?from=${encodeURIComponent(adminManagePath)}`}
                    className="secondaryButton compactButton"
                  >
                    Edit
                  </Link>
                  <form action={deleteThankYouAction} className="inlineActionForm">
                    <input type="hidden" name="thankYouId" value={item.id} />
                    <input type="hidden" name="returnTo" value={adminManagePath} />
                    <button className="dangerButton compactButton" type="submit">
                      Delete
                    </button>
                  </form>
                </>
              ) : undefined,
            }))}
          />
        ) : null}
        {show("introductions") ? (
          <ActivityList
            title="Introductions made"
            empty="No introductions logged yet."
            items={data.introductionsGiven.map((item) => ({
              id: item.id,
              when: item.createdAt,
              title: `${item.toMember.name} - ${item.contactName}`,
              detail: item.contactCompany || item.notes || item.toMember.businessName,
              actions: adminManagePath ? (
                <form action={deleteIntroductionAction} className="inlineActionForm">
                  <input type="hidden" name="introductionId" value={item.id} />
                  <input type="hidden" name="returnTo" value={adminManagePath} />
                  <button className="dangerButton compactButton" type="submit">
                    Delete
                  </button>
                </form>
              ) : undefined,
            }))}
          />
        ) : null}
        {show("testimonials") ? (
          <ActivityList
            title="Testimonials given"
            empty="No testimonials logged yet."
            items={data.testimonialsGiven.map((item) => ({
              id: item.id,
              when: item.createdAt,
              title: item.toMember.name,
              detail: item.notes || item.toMember.businessName,
              actions: adminManagePath ? (
                <form action={deleteTestimonialAction} className="inlineActionForm">
                  <input type="hidden" name="testimonialId" value={item.id} />
                  <input type="hidden" name="returnTo" value={adminManagePath} />
                  <button className="dangerButton compactButton" type="submit">
                    Delete
                  </button>
                </form>
              ) : undefined,
            }))}
          />
        ) : null}
        {show("visitors") ? (
          <ActivityList
            title="Visitors added"
            empty="No visitors added yet."
            items={data.visitorsAdded.map((item) => ({
              id: item.id,
              when: item.createdAt,
              title: item.visitorName,
              detail: `${item.visitorBusiness || "No business listed"} - meeting ${format(item.meeting.meetingDate, "dd MMM yyyy")}`,
              actions: adminManagePath ? (
                <form action={deleteVisitorAction} className="inlineActionForm">
                  <input type="hidden" name="visitorId" value={item.id} />
                  <input type="hidden" name="returnTo" value={adminManagePath} />
                  <button className="dangerButton compactButton" type="submit">
                    Delete
                  </button>
                </form>
              ) : undefined,
            }))}
          />
        ) : null}
      </section>

      <section className="card stack">
        <h2 className="sectionTitle">Received</h2>
        <p className="muted smallText">What this member has received or been credited with.</p>
        {show("referrals") ? (
          <ActivityList
            title="Referrals received"
            empty="No referrals received yet."
            items={data.referralsReceived.map((item) => ({
              id: item.id,
              when: item.createdAt,
              title: `${item.fromMember.name} - ${item.leadName}`,
              detail: item.notes || item.leadContact || item.fromMember.businessName,
              badge: referralStatusLabel(item.status),
              badgeTone: referralStatusTone(item.status),
              actions: (
                <>
                  {memberCanReviewReferrals && item.status !== "CONVERTED" ? (
                    <form action={updateOwnReferralStatusAction} className="inlineActionForm">
                      <input type="hidden" name="referralId" value={item.id} />
                      <input type="hidden" name="status" value={item.status === "LOST" ? "GIVEN" : "LOST"} />
                      <button className="secondaryButton compactButton" type="submit">
                        {item.status === "LOST" ? "Mark live" : "Not proceeding"}
                      </button>
                    </form>
                  ) : null}
                  {adminManagePath ? (
                    <>
                      <Link
                        href={`/admin/referrals/${item.id}?from=${encodeURIComponent(adminManagePath)}`}
                        className="secondaryButton compactButton"
                      >
                        Edit
                      </Link>
                      <form action={deleteReferralAction} className="inlineActionForm">
                        <input type="hidden" name="referralId" value={item.id} />
                        <input type="hidden" name="returnTo" value={adminManagePath} />
                        <button className="dangerButton compactButton" type="submit">
                          Delete
                        </button>
                      </form>
                    </>
                  ) : null}
                </>
              ),
            }))}
          />
        ) : null}
        {show("thank-you") ? (
          <ActivityList
            title="Thank yous received"
            empty="No thank yous received yet."
            items={data.thankYousReceived.map((item) => ({
              id: item.id,
              when: item.createdAt,
              title: `${item.fromMember.name} - ${currency(Number(item.amount))}`,
              detail: item.referral?.leadName ? `Referral: ${item.referral.leadName}` : item.notes || item.fromMember.businessName,
              actions: adminManagePath ? (
                <>
                  <Link
                    href={`/admin/thank-you/${item.id}?from=${encodeURIComponent(adminManagePath)}`}
                    className="secondaryButton compactButton"
                  >
                    Edit
                  </Link>
                  <form action={deleteThankYouAction} className="inlineActionForm">
                    <input type="hidden" name="thankYouId" value={item.id} />
                    <input type="hidden" name="returnTo" value={adminManagePath} />
                    <button className="dangerButton compactButton" type="submit">
                      Delete
                    </button>
                  </form>
                </>
              ) : undefined,
            }))}
          />
        ) : null}
        {show("testimonials") ? (
          <ActivityList
            title="Testimonials received"
            empty="No testimonials received yet."
            items={data.testimonialsReceived.map((item) => ({
              id: item.id,
              when: item.createdAt,
              title: item.fromMember.name,
              detail: item.notes || item.fromMember.businessName,
              actions: adminManagePath ? (
                <form action={deleteTestimonialAction} className="inlineActionForm">
                  <input type="hidden" name="testimonialId" value={item.id} />
                  <input type="hidden" name="returnTo" value={adminManagePath} />
                  <button className="dangerButton compactButton" type="submit">
                    Delete
                  </button>
                </form>
              ) : undefined,
            }))}
          />
        ) : null}
      </section>

      <section className="card stack">
        <h2 className="sectionTitle">Shared</h2>
        <p className="muted smallText">Activity where both members should be able to point to the same entry.</p>
        {show("one-to-ones") ? (
          <ActivityList
            title="1-2-1 history"
            empty="No 1-2-1s logged yet."
            items={data.oneToOnes.map((item) => {
              const otherMember = item.memberLowId === data.member.id ? item.memberHigh : item.memberLow;
              return {
                id: item.id,
                when: item.meetingDate,
                title: otherMember.name,
                detail: `${otherMember.businessName} - ${format(item.meetingDate, "dd MMM yyyy")}`,
                actions: adminManagePath ? (
                  <form action={deleteOneToOneAction} className="inlineActionForm">
                    <input type="hidden" name="oneToOneId" value={item.id} />
                    <input type="hidden" name="returnTo" value={adminManagePath} />
                    <button className="dangerButton compactButton" type="submit">
                      Delete
                    </button>
                  </form>
                ) : undefined,
              };
            })}
          />
        ) : null}
      </section>
    </div>
  );
}

function formatDateInput(value: Date | null) {
  return value ? format(value, "yyyy-MM-dd") : "";
}

function ActivityList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Array<{
    id: string;
    when: Date;
    title: string;
    detail?: string | null;
    badge?: string;
    badgeTone?: "live" | "success" | "muted";
    actions?: ReactNode;
  }>;
}) {
  return (
    <div className="stack activityListBlock" style={{ gap: 10 }}>
      <div className="activityListTitle" style={{ fontWeight: 700 }}>{title}</div>
      {items.length ? (
        <div className="list">
          {items.map((item) => (
            <div key={item.id} className="listRow activityRow">
              <div className="activityMeta">{format(item.when, "dd MMM yyyy")}</div>
              <div className="activityTitleRow">
                <div className="activityItemTitle" style={{ fontWeight: 700 }}>{item.title}</div>
                {item.badge ? <span className={`activityBadge activityBadge${capitalize(item.badgeTone || "muted")}`}>{item.badge}</span> : null}
              </div>
              {item.detail ? <div className="muted smallText">{item.detail}</div> : null}
              {item.actions ? <div className="inlineActions activityRowActions">{item.actions}</div> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="muted smallText">{empty}</div>
      )}
    </div>
  );
}

function referralStatusLabel(status: string) {
  switch (status) {
    case "CONVERTED":
      return "Converted";
    case "LOST":
      return "Not proceeding";
    default:
      return "Live";
  }
}

function referralStatusTone(status: string): "live" | "success" | "muted" {
  switch (status) {
    case "CONVERTED":
      return "success";
    case "LOST":
      return "muted";
    default:
      return "live";
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
