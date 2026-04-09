"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, KeyRound, RadioTower, Rows3 } from "lucide-react";

type AppNavProps = {
  isAdmin: boolean;
};

const baseItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/rota", label: "Rota", icon: RadioTower },
  { href: "/activity", label: "Activity", icon: Rows3 },
  { href: "/pin", label: "Details", icon: KeyRound },
] as const;

export function AppNav({ isAdmin }: AppNavProps) {
  const pathname = usePathname();
  const items = isAdmin ? [...baseItems, { href: "/admin", label: "Admin", icon: LayoutDashboard }] : baseItems;

  return (
    <nav className="appNav" aria-label="App navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link key={item.href} className={`appNavItem${active ? " appNavItemActive" : ""}`} href={item.href}>
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
