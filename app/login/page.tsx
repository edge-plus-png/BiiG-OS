import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentMember } from "@/lib/auth";
import { getMembers } from "@/lib/data";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const member = await getCurrentMember();
  if (member) {
    redirect("/");
  }

  const params = await searchParams;
  const members = await getMembers();

  return (
    <AppShell>
      <LoginForm members={members} error={params.error} />
    </AppShell>
  );
}
