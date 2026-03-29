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
} from "@heroicons/react/24/outline";
import {
  Squares2X2Icon as Squares2X2IconSolid,
  UserGroupIcon as UserGroupIconSolid,
  InboxStackIcon as InboxStackIconSolid,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

/** Employee app only — super_admin and employer are routed to other shells. */
const mainNav = [
  { href: "/dashboard", label: "Dashboard", Icon: Squares2X2Icon, IconSolid: Squares2X2IconSolid },
  { href: "/coworker-matches", label: "Matches", Icon: UserGroupIcon, IconSolid: UserGroupIconSolid },
  { href: "/requests", label: "Requests", Icon: InboxStackIcon, IconSolid: InboxStackIconSolid, badgeKey: "requests" },
];

const bottomNav = [
  { href: "/profile", label: "Profile", Icon: UserCircleIcon },
  { href: "/settings", label: "Settings", Icon: Cog6ToothIcon },
];

export function WorkVouchSidebar({
  pendingReferenceRequestCount = 0,
  mobileOpen,
  onCloseMobile,
}: {
  /** @deprecated Kept for API compatibility; employee shell only. */
  role?: "employee" | "employer" | "admin" | null;
  pendingReferenceRequestCount?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
} = {}) {
  const pathname = usePathname();

  const navContent = (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-blue-200/80 px-4 dark:border-blue-900/40">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onCloseMobile} aria-label="WorkVouch home">
          <Image
            src="/images/workvouch-logo.png.png"
            alt=""
            width={120}
            height={32}
            className="h-7 w-auto object-contain dark:opacity-95"
            priority
          />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {onCloseMobile && (
          <div className="flex justify-end p-2 md:hidden">
            <button
              type="button"
              onClick={onCloseMobile}
              className="rounded-lg p-2 text-blue-600 hover:bg-blue-100"
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
                  ? "bg-blue-600 text-white"
                  : "text-blue-800 hover:bg-blue-100"
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
        <div className="my-2 border-t border-blue-200/80" />
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
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-blue-200/80 bg-blue-50">
        {navContent}
      </aside>
      {onCloseMobile && (
        <>
          <div
            className={cn(
              "fixed inset-0 z-40 bg-blue-950/15 backdrop-blur-sm transition-opacity md:hidden",
              mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            onClick={onCloseMobile}
            aria-hidden
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-blue-200/80 bg-blue-50 shadow-xl transition-transform duration-200 ease-out md:hidden",
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
