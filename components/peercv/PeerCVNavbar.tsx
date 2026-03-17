"use client";

import Link from "next/link";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { NotificationBell } from "./NotificationBell";

export function PeerCVNavbar({
  unreadNotificationCount = 0,
  userInitial,
  profilePhotoUrl,
  onMenuClick,
}: {
  unreadNotificationCount?: number;
  userInitial?: string;
  profilePhotoUrl?: string | null;
  onMenuClick?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        )}
        <Link
          href="/coworker-matches"
          className="flex items-center gap-2 text-lg font-semibold text-slate-900 transition-opacity hover:opacity-90"
        >
          <span className="tracking-tight">PeerCV</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell unreadCount={unreadNotificationCount} />
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          aria-label="Profile"
        >
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{userInitial ?? "?"}</span>
          )}
        </Link>
      </div>
    </header>
  );
}
