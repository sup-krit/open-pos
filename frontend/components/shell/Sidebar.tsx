"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { useCurrentRole } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  AccountingIcon,
  CustomersIcon,
  DashboardIcon,
  InventoryIcon,
  OrdersIcon,
  PosIcon,
  PromotionsIcon,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  ownerOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/pos", label: "POS", icon: PosIcon },
  { href: "/orders", label: "Orders", icon: OrdersIcon },
  { href: "/inventory", label: "Inventory", icon: InventoryIcon },
  { href: "/customers", label: "Customers", icon: CustomersIcon },
  { href: "/promotions", label: "Promotions", icon: PromotionsIcon, ownerOnly: true },
  { href: "/accounting", label: "Accounting", icon: AccountingIcon, ownerOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useCurrentRole();
  const visibleItems = NAV_ITEMS.filter((item) => !item.ownerOnly || role === "owner_admin");

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside className="w-[220px] shrink-0 bg-surface border-r border-border flex flex-col py-5 gap-0.5">
      <div className="font-display italic font-semibold text-[17px] px-5 pb-5 tracking-tight">
        Open POS
      </div>
      <nav className="flex flex-col gap-0.5">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard" ? pathname === href : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-5 py-2.5 text-[13px] transition-colors ${
                active
                  ? "bg-accent/[0.08] text-accent font-medium"
                  : "text-ink hover:bg-paper"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto mx-5 h-9 rounded-md border border-border text-[13px] font-medium text-ink hover:bg-paper"
      >
        Logout
      </button>
    </aside>
  );
}
