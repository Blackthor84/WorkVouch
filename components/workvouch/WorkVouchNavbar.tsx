"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bars3Icon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { NotificationBell } from "./NotificationBell";
import { supabaseBrowser } from "@/lib/supabase/browser";

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
          href="/dashboard"
          className="flex items-center transition-opacity hover:opacity-90"
          aria-label="WorkVouch home"
        >
          <Image
            src="/images/workvouch-logo.png.png"
            alt=""
            width={140}
            height={36}
            className="h-8 w-auto max-h-8 object-contain brightness-0 invert opacity-95"
            priority
          />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-lg bg-blue-500/20 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500/30"
          title="Trust Score"
        >
          <span className="tabular-nums">{Math.min(100, Math.max(0, trustScore))}</span>
          <span className="text-white/80 font-medium text-xs">Trust</span>
        </Link>
        <NotificationBell
          unreadCount={unreadNotificationCount}
          variant="header"
        />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-blue-500/20 text-sm font-medium text-white ring-1 ring-white/20 transition-all hover:bg-blue-500/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-blue-600"
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
              <div className="p-1">
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
