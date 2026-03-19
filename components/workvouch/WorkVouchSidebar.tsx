"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Squares2X2Icon,
  UserGroupIcon,
  InboxStackIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  XMarkIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import {
  Squares2X2Icon as Squares2X2IconSolid,
  UserGroupIcon as UserGroupIconSolid,
  InboxStackIcon as InboxStackIconSolid,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

const employeeMainNav = [
  { href: "/coworker-matches", label: "Dashboard", Icon: Squares2X2Icon, IconSolid: Squares2X2IconSolid },
  { href: "/coworker-matches", label: "Matches", Icon: UserGroupIcon, IconSolid: UserGroupIconSolid },
  { href: "/requests", label: "References", Icon: InboxStackIcon, IconSolid: InboxStackIconSolid, badgeKey: "requests" },
];

const employerMainNav = [
  { href: "/dashboard/employer", label: "Dashboard", Icon: Squares2X2Icon, IconSolid: Squares2X2IconSolid },
  { href: "/dashboard/employer", label: "Candidates", Icon: UserGroupIcon, IconSolid: UserGroupIconSolid },
  { href: "/dashboard/employer#billing", label: "Billing", Icon: CreditCardIcon, IconSolid: CreditCardIcon },
];

const bottomNav = [
  { href: "/profile", label: "Profile", Icon: UserCircleIcon },
  { href: "/settings", label: "Settings", Icon: Cog6ToothIcon },
];

export function WorkVouchSidebar({
  role = null,
  pendingReferenceRequestCount = 0,
  mobileOpen,
  onCloseMobile,
}: {
  role?: "employee" | "employer" | "admin" | null;
  pendingReferenceRequestCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
} = {}) {
  const pathname = usePathname();
  const mainNav = role === "employer" ? employerMainNav : employeeMainNav;
  const logoHref = role === "employer" ? "/dashboard/employer" : "/coworker-matches";

  const navContent = (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-slate-200/80 px-4">
        <Link href={logoHref} className="flex items-center gap-2" onClick={onCloseMobile}>
          <Image
            src="/images/workvouch-logo.png.png"
            alt="WorkVouch"
            width={120}
            height={40}
            className="h-8 w-auto"
            style={{ objectFit: "contain" }}
          />
          <span className="font-semibold text-slate-900 hidden sm:inline">WorkVouch</span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
      {onCloseMobile && (
        <div className="flex justify-end p-2 md:hidden">
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      )}
      {mainNav.map(({ href, label, Icon, IconSolid, badgeKey }) => {
        const isActive = pathname === href || (href !== "/coworker-matches" && href !== "#" && pathname.startsWith(href));
        const Comp = isActive ? IconSolid : Icon;
        const badgeCount = badgeKey === "requests" ? pendingReferenceRequestCount : 0;
        return (
          <Link
            key={href}
            href={href}
            onClick={onCloseMobile}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Comp className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
            {label}
            {badgeCount > 0 && (
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </Link>
        );
      })}
      <div className="my-2 border-t border-slate-200/80" />
      {bottomNav.map(({ href, label, Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onCloseMobile}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
              isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            {label}
          </Link>
        );
      })}
      </nav>
    </>
  );

  return (
    <>
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white">
        {navContent}
      </aside>
      {onCloseMobile && (
        <>
          <div
            className={cn(
              "fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity md:hidden",
              mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            onClick={onCloseMobile}
            aria-hidden
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-xl transition-transform duration-200 ease-out md:hidden",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
