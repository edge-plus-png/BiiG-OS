import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Member, MemberRole } from "@prisma/client";
import { logoutAction } from "@/lib/actions";

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
        {member ? (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700 }}>{member.name}</div>
            <div className="muted smallText">{member.role === MemberRole.ADMIN ? "Leadership" : "Member"}</div>
          </div>
        ) : null}
      </header>

      {member ? (
        <nav className="navRow">
          <Link className="secondaryButton navButton" href="/">
            Home
          </Link>
          <Link className="secondaryButton navButton" href="/rota">
            Speaker rota
          </Link>
          <Link className="secondaryButton navButton" href="/activity">
            My activity
          </Link>
          <Link className="secondaryButton navButton" href="/pin">
            My PIN
          </Link>
          {member.role === MemberRole.ADMIN ? (
            <Link className="secondaryButton navButton" href="/admin">
              Admin
            </Link>
          ) : null}
          <form action={logoutAction} className="navForm">
            <button className="secondaryButton navButton" type="submit">
              <LogOut size={18} />
              Log out
            </button>
          </form>
        </nav>
      ) : null}

      {children}
    </div>
  );
}
