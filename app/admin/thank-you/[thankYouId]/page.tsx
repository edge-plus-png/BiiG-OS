import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { deleteThankYouAction, updateThankYouAction } from "@/lib/actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getSafeReturnPath(value?: string) {
  return value && value.startsWith("/") ? value : "/admin/members";
}

function recipientValue(
  recipient: { id: string } | null,
  externalName?: string | null,
) {
  if (recipient) {
    return `member:${recipient.id}`;
  }
  if (externalName === "Visitor") {
    return "external:visitor";
  }
  if (externalName === "Ex-member") {
    return "external:ex-member";
  }
  return "";
}

export default async function AdminThankYouEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ thankYouId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const admin = await requireAdmin();
  const [{ thankYouId }, query] = await Promise.all([params, searchParams]);
  const returnTo = getSafeReturnPath(query.from);

  const [thankYou, members] = await Promise.all([
    prisma.thankYou.findUnique({
      where: { id: thankYouId },
      include: {
        fromMember: true,
        toMember: true,
        referral: true,
      },
    }),
    prisma.member.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: { id: true, name: true, businessName: true, isActive: true },
    }),
  ]);

  if (!thankYou) {
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
          <h1 className="sectionTitle">Edit thank you</h1>
          <p className="muted smallText">
            Logged by {thankYou.fromMember.name}. Adjust the recipient or amount here if a business value was entered against the wrong person.
          </p>
          {thankYou.referral ? (
            <p className="muted smallText">Linked referral: {thankYou.referral.leadName}</p>
          ) : null}
        </div>

        <form action={updateThankYouAction} className="stack">
          <input type="hidden" name="thankYouId" value={thankYou.id} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <label className="label">
            Thank you to
            <select
              className="select"
              name="recipient"
              defaultValue={recipientValue(thankYou.toMember, thankYou.toExternalName)}
            >
              {members.map((member) => (
                <option key={member.id} value={`member:${member.id}`}>
                  {member.name} - {member.businessName}
                  {member.isActive ? "" : " (Archived)"}
                </option>
              ))}
              <option value="external:visitor">Visitor</option>
              <option value="external:ex-member">Ex-member</option>
            </select>
          </label>

          <label className="label">
            Amount (£)
            <input className="input" name="amount" type="number" min="0" step="0.01" defaultValue={String(thankYou.amount)} required />
          </label>

          <label className="label">
            Notes
            <textarea className="textarea" name="notes" defaultValue={thankYou.notes ?? ""} />
          </label>

          <button className="primaryButton" type="submit">
            Save thank you
          </button>
        </form>

        <form action={deleteThankYouAction} className="stack">
          <input type="hidden" name="thankYouId" value={thankYou.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className="dangerButton" type="submit">
            Delete thank you
          </button>
        </form>
      </section>
    </AppShell>
  );
}
