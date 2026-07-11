"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { WvTrustScore } from "@/components/wv";

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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-wv-border bg-wv-bg/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-wv-muted hover:bg-wv-surface hover:text-white md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 md:pl-1">
          <p className="truncate text-base font-semibold tracking-tight text-wv-foreground sm:text-lg">
            {pageTitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link href="/dashboard" className="hidden sm:block" title="Trust score">
          <WvTrustScore score={trustScore} size="sm" showLabel={false} animate={false} />
        </Link>
        <NotificationBell unreadCount={unreadNotificationCount} variant="default" />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-wv-surface text-sm font-medium text-wv-foreground ring-1 ring-wv-border transition-all hover:ring-wv-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wv-brand-blue/50"
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
              className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-wv-border bg-wv-bg-subtle py-2 shadow-2xl backdrop-blur-xl"
              role="menu"
            >
              {userEmail && (
                <div className="border-b border-wv-border px-4 py-3">
                  <p className="truncate text-sm text-wv-muted" title={userEmail}>
                    {userEmail}
                  </p>
                </div>
              )}
              <div className="p-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                  role="menuitem"
                >
                  <LogOut className="h-5 w-5 shrink-0" aria-hidden />
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
