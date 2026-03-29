"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bars3Icon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { NotificationBell } from "./NotificationBell";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

function titleFromPath(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname.startsWith("/coworker-matches")) return "Matches";
  if (pathname.startsWith("/requests")) return "Requests";
  if (pathname.startsWith("/notifications")) return "Notifications";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/onboarding")) return "Onboarding";
  if (pathname.startsWith("/my-jobs")) return "Job history";
  if (pathname.startsWith("/upload-resume")) return "Resume";
  if (pathname.startsWith("/dashboard/")) return "Dashboard";
  if (pathname.startsWith("/jobs")) return "Jobs";
  return "Dashboard";
}

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
  const pathname = usePathname();
  const pageTitle = useMemo(() => titleFromPath(pathname), [pathname]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200/90 bg-white/90 px-4 shadow-sm backdrop-blur-md sm:px-6",
        "dark:border-slate-800 dark:bg-slate-950/90"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 md:pl-1">
          <p className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">
            {pageTitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/dashboard"
          className={cn(
            "hidden items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800 sm:inline-flex",
            "dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-100"
          )}
          title="Trust score"
        >
          <span className="tabular-nums">{Math.min(100, Math.max(0, trustScore))}</span>
          <span className="text-xs font-medium text-blue-600/80 dark:text-blue-300/90">Trust</span>
        </Link>
        <Link
          href="/dashboard"
          className={cn(
            "inline-flex h-10 min-w-[2.5rem] items-center justify-center rounded-full border border-blue-100 bg-blue-50 px-2 text-sm font-semibold text-blue-800 sm:hidden",
            "dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-100"
          )}
          title="Trust score"
        >
          <span className="tabular-nums">{Math.min(100, Math.max(0, trustScore))}</span>
        </Link>
        <NotificationBell unreadCount={unreadNotificationCount} variant="default" />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-medium text-slate-700 ring-2 ring-white transition-all hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-950"
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
              className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200/80 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-900"
              role="menu"
            >
              {userEmail && (
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400" title={userEmail}>
                    {userEmail}
                  </p>
                </div>
              )}
              <div className="p-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
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
