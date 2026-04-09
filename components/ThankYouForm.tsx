"use client";

import { useMemo, useState } from "react";
import { saveThankYouAction } from "@/lib/actions";

type ThankYouFormProps = {
  members: Array<{ id: string; name: string; businessName: string }>;
  referrals: Array<{
    id: string;
    fromMemberId: string;
    leadName: string;
    fromMember: { name: string; businessName: string };
  }>;
};

export function ThankYouForm({ members, referrals }: ThankYouFormProps) {
  const [recipient, setRecipient] = useState("");
  const selectedMemberId = recipient.startsWith("member:") ? recipient.replace("member:", "") : "";

  const matchingReferrals = useMemo(
    () => referrals.filter((item) => item.fromMemberId === selectedMemberId),
    [referrals, selectedMemberId],
  );

  return (
    <form action={saveThankYouAction} className="formGrid">
      <label className="label">
        Thank you to
        <select className="select" name="recipient" required value={recipient} onChange={(event) => setRecipient(event.target.value)}>
          <option value="" disabled>
            Choose who this is for
          </option>
          {members.map((item) => (
            <option key={item.id} value={`member:${item.id}`}>
              {item.name} - {item.businessName}
            </option>
          ))}
          <option value="external:visitor">Visitor</option>
          <option value="external:ex-member">Ex-member</option>
        </select>
      </label>
      <label className="label">
        Amount (£)
        <input className="input" name="amount" type="number" step="0.01" min="0.01" required />
      </label>
      <label className="label">
        Link to referral
        <select className="select" name="referralId" defaultValue="" disabled={!selectedMemberId || matchingReferrals.length === 0}>
          <option value="">
            {!selectedMemberId ? "Only available for current members" : matchingReferrals.length === 0 ? "No matching referrals from this member" : "Optional"}
          </option>
          {matchingReferrals.map((item) => (
            <option key={item.id} value={item.id}>
              {item.fromMember.name} - {item.leadName}
            </option>
          ))}
        </select>
        <span className="muted smallText">Only referrals this member has passed to you are shown.</span>
      </label>
      <label className="label">
        Notes
        <textarea className="textarea" name="notes" />
      </label>
      <button className="primaryButton" type="submit">
        Save thank you
      </button>
    </form>
  );
}
