"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/browser";
import {
  Squares2X2Icon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

const linkClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100";

export function ProfileDropdown() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    getUser();

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange(() => {
      getUser();
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getUser = async () => {
    const { data } = await supabaseBrowser.auth.getUser();
    setUser(data.user);
  };

  const logout = async () => {
    setOpen(false);
    await supabaseBrowser.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (!user) return null;

  const initial = user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center font-semibold cursor-pointer transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <span>{initial}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-slate-200/80 bg-white py-2 shadow-lg"
          role="menu"
        >
          {user.email && (
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="truncate text-sm text-slate-500" title={user.email}>
                {user.email}
              </p>
            </div>
          )}
          <div className="py-1">
            <Link
              href="/coworker-matches"
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              <Squares2X2Icon className="h-5 w-5 shrink-0 text-slate-400" />
              Dashboard
            </Link>
            <Link
              href="/profile"
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              <UserCircleIcon className="h-5 w-5 shrink-0 text-slate-400" />
              Profile
            </Link>
            <Link
              href="/settings"
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              <Cog6ToothIcon className="h-5 w-5 shrink-0 text-slate-400" />
              Settings
            </Link>
          </div>
          <div className="border-t border-slate-100 pt-1">
            <button
              type="button"
              onClick={logout}
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
  );
}
