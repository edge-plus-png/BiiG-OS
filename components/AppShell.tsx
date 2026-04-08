import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Member, MemberRole } from "@prisma/client";
import { logoutAction } from "@/lib/actions";
import { AppNav } from "@/components/AppNav";

type AppShellProps = {
  member?: Pick<Member, "name" | "role"> | null;
  children: React.ReactNode;
};

export function AppShell({ member, children }: AppShellProps) {
  return (
    <div className="pageShell stack">
      <header className="card appHeader">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Image src="/BiiG-logo.png" alt="BiiG" width={116} height={44} priority />
        </Link>
        <div className="headerMeta">
          {member ? (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700 }}>{member.name}</div>
              <div className="muted smallText">{member.role === MemberRole.ADMIN ? "Leadership" : "Member"}</div>
            </div>
          ) : null}
          {member ? (
            <form action={logoutAction}>
              <button className="secondaryButton headerIconButton" type="submit" aria-label="Log out">
                <LogOut size={18} />
              </button>
            </form>
          ) : null}
        </div>
      </header>

      {member ? <AppNav isAdmin={member.role === MemberRole.ADMIN} /> : null}

      {children}
    </div>
  );
}
