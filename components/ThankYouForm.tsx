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
  const [toMemberId, setToMemberId] = useState("");

  const matchingReferrals = useMemo(
    () => referrals.filter((item) => item.fromMemberId === toMemberId),
    [referrals, toMemberId],
  );

  return (
    <form action={saveThankYouAction} className="formGrid">
      <label className="label">
        To member
        <select className="select" name="toMemberId" required value={toMemberId} onChange={(event) => setToMemberId(event.target.value)}>
          <option value="" disabled>
            Choose a member
          </option>
          {members.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} - {item.businessName}
            </option>
          ))}
        </select>
      </label>
      <label className="label">
        Amount (£)
        <input className="input" name="amount" type="number" step="0.01" min="0.01" required />
      </label>
      <label className="label">
        Link to referral
        <select className="select" name="referralId" defaultValue="" disabled={!toMemberId || matchingReferrals.length === 0}>
          <option value="">
            {!toMemberId ? "Choose a member first" : matchingReferrals.length === 0 ? "No matching referrals from this member" : "Optional"}
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
