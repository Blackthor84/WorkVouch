"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsBell } from "./notifications-bell";
import { Logo } from "./logo";
import { User } from "@/lib/auth";

interface NavbarClientProps {
  user?: User | null;
  roles?: string[];
}

export function NavbarClient({ user: userProp, roles: rolesProp }: NavbarClientProps = {}) {
  const { data: session, status } = useSession();
  const user = userProp ?? session?.user;
  const roles = rolesProp ?? session?.user?.roles ?? [];

  return (
    <nav className="sticky top-0 z-50 border-b border-grey-background dark:border-[#374151] bg-white dark:bg-[#0D1117] shadow-sm py-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          <div className="flex items-center">
            <Logo size="xl" showText={false} />
          </div>
          <div className="flex items-center gap-3 justify-end">
            {impersonating && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await updateSession({ stopImpersonation: true });
                  router.push("/admin");
                }}
                className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
              >
                Exit Impersonation
              </Button>
            )}
            <ThemeToggle />

            {status === "loading" ? (
              <span className="text-sm text-grey-medium dark:text-gray-400">Loading...</span>
            ) : user ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  href="/dashboard"
                  className="hover:bg-grey-background dark:hover:bg-[#1A1F2B]"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  href="/profile"
                  className="hover:bg-grey-background dark:hover:bg-[#1A1F2B]"
                >
                  Profile
                </Button>
                <NotificationsBell />
                <Button variant="ghost" size="sm" href="/pricing" className="hover:bg-grey-background dark:hover:bg-[#1A1F2B]">
                  Pricing
                </Button>
                {(roles.includes("admin") || roles.includes("superadmin")) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    href="/admin"
                    className="font-semibold text-primary dark:text-blue-400 hover:bg-grey-background dark:hover:bg-[#1A1F2B]"
                  >
                    Admin Panel
                  </Button>
                )}
                {(roles.includes("employer") || roles.includes("superadmin")) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    href="/employer/dashboard"
                    className="font-semibold hover:bg-grey-background dark:hover:bg-[#1A1F2B]"
                  >
                    Employer Panel
                  </Button>
                )}
                <span className="hidden sm:inline text-sm text-grey-dark dark:text-gray-300">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hover:bg-grey-background dark:hover:bg-[#1A1F2B]"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" href="/pricing" className="hover:bg-grey-background dark:hover:bg-[#1A1F2B]">
                  Pricing
                </Button>
                <Button variant="ghost" size="sm" href="/auth/signin" className="hover:bg-grey-background dark:hover:bg-[#1A1F2B]">
                  Sign In
                </Button>
                <Button size="sm" href="/auth/signup">
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
