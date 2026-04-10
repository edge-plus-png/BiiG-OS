import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReferralStatus } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { updateReferralAction, deleteReferralAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getSafeReturnPath(value?: string) {
  return value && value.startsWith("/") ? value : "/admin/members";
}

function recipientValue(
  recipient: { id: string } | null,
) {
  if (recipient) {
    return `member:${recipient.id}`;
  }
  return "";
}

export default async function AdminReferralEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ referralId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const admin = await requireAdmin();
  const [{ referralId }, query] = await Promise.all([params, searchParams]);
  const returnTo = getSafeReturnPath(query.from);

  const [referral, members] = await Promise.all([
    prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        fromMember: true,
        toMember: true,
      },
    }),
    prisma.member.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, businessName: true, isActive: true },
    }),
  ]);

  if (!referral) {
    notFound();
  }

  return (
    <AppShell member={admin}>
      <section className="card stack">
        <Link href={returnTo} className="inlineLink">
          <ArrowLeft size={16} />
          Back
        </Link>
        <div>
          <h1 className="sectionTitle">Edit referral</h1>
          <p className="muted smallText">
            Logged by {referral.fromMember.name}. Use this when leadership needs to tidy a duplicate or fix the details.
          </p>
        </div>

        <form action={updateReferralAction} className="stack">
          <input type="hidden" name="referralId" value={referral.id} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <label className="label">
            To
            <select
              className="select"
              name="recipient"
              defaultValue={recipientValue(referral.toMember)}
              required
            >
              <option value="" disabled>
                Choose who this is for
              </option>
              {members.map((member) => (
                <option key={member.id} value={`member:${member.id}`}>
                  {member.name} - {member.businessName}
                  {member.isActive ? "" : " (Archived)"}
                </option>
              ))}
            </select>
          </label>
          {!referral.toMemberId && referral.toExternalName ? (
            <p className="muted smallText">
              This is a legacy external referral entry. Please choose the correct member before saving.
            </p>
          ) : null}

          <label className="label">
            Lead name
            <input className="input" name="leadName" defaultValue={referral.leadName} required />
          </label>

          <label className="label">
            Lead contact
            <input className="input" name="leadContact" defaultValue={referral.leadContact ?? ""} />
          </label>

          <label className="label">
            Status
            <select className="select" name="status" defaultValue={referral.status}>
              <option value={ReferralStatus.GIVEN}>Live</option>
              <option value={ReferralStatus.CONVERTED}>Converted</option>
              <option value={ReferralStatus.LOST}>Not proceeding</option>
            </select>
          </label>

          <label className="label">
            Notes
            <textarea className="textarea" name="notes" defaultValue={referral.notes ?? ""} />
          </label>

          <button className="primaryButton" type="submit">
            Save referral
          </button>
        </form>

        <form action={deleteReferralAction} className="stack">
          <input type="hidden" name="referralId" value={referral.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <ConfirmSubmitButton className="dangerButton" message="Delete this referral? This cannot be undone.">
            Delete referral
          </ConfirmSubmitButton>
        </form>
      </section>
    </AppShell>
  );
}
