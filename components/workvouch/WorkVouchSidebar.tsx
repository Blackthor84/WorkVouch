"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Inbox,
  UserCircle,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WvTrustScore } from "@/components/wv";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/coworker-matches", label: "Matches", Icon: Users },
  { href: "/requests", label: "Requests", Icon: Inbox, badgeKey: "requests" as const },
];

const bottomNav = [
  { href: "/profile", label: "Profile", Icon: UserCircle },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function WorkVouchSidebar({
  pendingReferenceRequestCount = 0,
  trustScore = 0,
  mobileOpen,
  onCloseMobile,
}: {
  pendingReferenceRequestCount?: number;
  trustScore?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

  const navContent = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-wv-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2 rounded-lg" onClick={onCloseMobile} aria-label="WorkVouch home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold text-white shadow-md">
            WV
          </span>
          <span className="text-sm font-bold text-wv-foreground">WorkVouch</span>
        </Link>
        {onCloseMobile && (
          <button type="button" onClick={onCloseMobile} className="rounded-lg p-1.5 text-wv-muted hover:bg-wv-surface hover:text-white md:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="border-b border-wv-border px-4 py-4">
        <div className="flex items-center justify-center">
          <WvTrustScore score={trustScore} size="sm" showLabel />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Employee navigation">
        {mainNav.map(({ href, label, Icon, badgeKey }) => {
          const isActive =
            pathname === href ||
            (href !== "/coworker-matches" && href !== "#" && pathname?.startsWith(href));
          const badgeCount = badgeKey === "requests" ? pendingReferenceRequestCount : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onCloseMobile}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-500/20 to-violet-500/10 text-white ring-1 ring-blue-500/30"
                  : "text-wv-muted hover:bg-wv-surface hover:text-wv-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2 : 1.5} aria-hidden />
              {label}
              {badgeCount > 0 && (
                <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
        <div className="my-2 border-t border-wv-border" />
        {bottomNav.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onCloseMobile}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive ? "bg-wv-surface text-white" : "text-wv-muted hover:bg-wv-surface hover:text-wv-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-wv-border bg-wv-bg-subtle/80 backdrop-blur-xl md:flex">
        {navContent}
      </aside>
      {onCloseMobile && (
        <>
          <div
            className={cn(
              "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden",
              mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            onClick={onCloseMobile}
            aria-hidden
          />
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-wv-border bg-wv-bg-subtle shadow-2xl transition-transform duration-200 ease-out md:hidden",
              mobileOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
