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

export function WorkVouchNavbar({
  unreadNotificationCount = 0,
  userInitial,
  userEmail,
  profilePhotoUrl,
  onMenuClick,
}: {
  unreadNotificationCount?: number;
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
          title="WorkVouch"
        >
          <span className="tracking-tight">WorkVouch</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell unreadCount={unreadNotificationCount} />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-medium text-slate-600 ring-1 ring-transparent transition-all hover:bg-slate-200 hover:ring-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
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
