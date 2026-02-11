"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UserCircleIcon,
  PlusCircleIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  PlusCircleIcon as PlusCircleIconSolid,
  BellAlertIcon as BellAlertIconSolid,
} from "@heroicons/react/24/solid";

const navItems = [
  { href: "/dashboard", label: "Dashboard", Icon: HomeIcon, IconSolid: HomeIconSolid },
  { href: "/profile", label: "Profile", Icon: UserCircleIcon, IconSolid: UserCircleIconSolid },
  { href: "/profile", label: "Add Job", Icon: PlusCircleIcon, IconSolid: PlusCircleIconSolid },
  { href: "/notifications", label: "Notifications", Icon: BellAlertIcon, IconSolid: BellAlertIconSolid },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[#E2E8F0] bg-white py-2 safe-area-pb dark:border-gray-700 dark:bg-[#0D1117] md:hidden"
      role="navigation"
      aria-label="Main"
    >
      {navItems.map(({ href, label, Icon, IconSolid }) => {
        const isActive =
          pathname === href || (pathname?.startsWith(href) && href !== "/dashboard");
        const isAddJob = label === "Add Job";
        const active = isAddJob ? false : isActive;

        return (
          <Link
            key={href + label}
            href={href}
            className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors aria-[current=page]:bg-blue-50 dark:aria-[current=page]:bg-blue-900/20"
            aria-current={active ? "page" : undefined}
          >
            {active ? (
              <IconSolid className="h-6 w-6 text-[#2563EB]" aria-hidden />
            ) : (
              <Icon className="h-6 w-6 text-grey-medium dark:text-gray-400" aria-hidden />
            )}
            <span className={active ? "text-[#2563EB]" : "text-grey-medium dark:text-gray-400"}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
