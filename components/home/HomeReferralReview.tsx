import { updateOwnReferralStatusAction } from "@/lib/actions";
import { getHomeReferralReviewData } from "@/lib/data";

export async function HomeReferralReview({ memberId }: { memberId: string }) {
  const referrals = await getHomeReferralReviewData(memberId);

  if (!referrals.length) {
    return null;
  }

  return (
    <section className="card stack">
      <div>
        <h2 className="sectionTitle">Referrals to review</h2>
        <p className="muted smallText">Keep these current so your pipeline stays accurate for you and leadership.</p>
      </div>
      <div className="list">
        {referrals.map((referral) => (
          <div key={referral.id} className="listRow activityRow">
            <div className="activityMeta">From {referral.fromMember.name}</div>
            <div className="activityItemTitle" style={{ fontWeight: 700 }}>
              {referral.leadName}
            </div>
            <div className="muted smallText">{referral.notes || referral.leadContact || referral.fromMember.businessName}</div>
            <div className="inlineActions activityRowActions">
              <form action={updateOwnReferralStatusAction} className="inlineActionForm">
                <input type="hidden" name="referralId" value={referral.id} />
                <input type="hidden" name="status" value="GIVEN" />
                <input type="hidden" name="returnTo" value="/" />
                <button className="secondaryButton compactButton" type="submit">
                  Still live
                </button>
              </form>
              <form action={updateOwnReferralStatusAction} className="inlineActionForm">
                <input type="hidden" name="referralId" value={referral.id} />
                <input type="hidden" name="status" value="LOST" />
                <input type="hidden" name="returnTo" value="/" />
                <button className="dangerButton compactButton" type="submit">
                  Not proceeding
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeReferralReviewFallback() {
  return (
    <section className="card stack">
      <h2 className="sectionTitle">Referrals to review</h2>
      <p className="muted">Loading referrals...</p>
    </section>
  );
}
