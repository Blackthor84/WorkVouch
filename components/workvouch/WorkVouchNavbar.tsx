"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  Squares2X2Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { NotificationBell } from "./NotificationBell";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { SmartGuide } from "@/components/guidance/SmartGuide";

export function WorkVouchNavbar({
  unreadNotificationCount = 0,
  trustScore = 0,
  userInitial,
  userEmail,
  profilePhotoUrl,
  onMenuClick,
}: {
  unreadNotificationCount?: number;
  trustScore?: number;
  userInitial?: string;
  userEmail?: string | null;
  profilePhotoUrl?: string | null;
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // React to auth state change (e.g. logout in another tab)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setDropdownOpen(false);
        router.push("/login");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabaseBrowser.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const linkClass =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-blue-600 px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/90 hover:bg-white/10 md:hidden transition-colors"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        )}
        <Link
          href="/coworker-matches"
          className="text-lg font-semibold text-white transition-opacity hover:opacity-90"
          title="WorkVouch"
        >
          <span className="tracking-tight">WorkVouch</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/coworker-matches"
          className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25 transition-colors"
          title="Trust Score"
        >
          <span className="tabular-nums">{Math.min(100, Math.max(0, trustScore))}</span>
          <span className="text-white/80 font-medium text-xs">Trust</span>
        </Link>
        <NotificationBell unreadCount={unreadNotificationCount} />
        <SmartGuide variant="light" />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white/15 text-sm font-medium text-white ring-1 ring-white/20 transition-all hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-blue-600"
            aria-label="Profile menu"
            aria-expanded={dropdownOpen}
          >
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{userInitial ?? "?"}</span>
            )}
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200/80 bg-white py-2 shadow-lg"
              role="menu"
            >
              {userEmail && (
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm text-slate-500" title={userEmail}>
                    {userEmail}
                  </p>
                </div>
              )}
              <div className="py-1">
                <Link
                  href="/coworker-matches"
                  className={linkClass}
                  onClick={() => setDropdownOpen(false)}
                >
                  <Squares2X2Icon className="h-5 w-5 shrink-0 text-slate-400" />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className={linkClass}
                  onClick={() => setDropdownOpen(false)}
                >
                  <UserCircleIcon className="h-5 w-5 shrink-0 text-slate-400" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className={linkClass}
                  onClick={() => setDropdownOpen(false)}
                >
                  <Cog6ToothIcon className="h-5 w-5 shrink-0 text-slate-400" />
                  Settings
                </Link>
              </div>
              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  role="menuitem"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
