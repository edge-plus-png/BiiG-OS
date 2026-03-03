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
          <Link className="secondaryButton" href="/">
            Home
          </Link>
          <Link className="secondaryButton" href="/rota">
            Speaker rota
          </Link>
          {member.role === MemberRole.ADMIN ? (
            <Link className="secondaryButton" href="/admin">
              Admin
            </Link>
          ) : null}
          <form action={logoutAction} style={{ width: "100%" }}>
            <button className="secondaryButton" type="submit">
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
