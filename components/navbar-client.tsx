"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsBell } from "./notifications-bell";
import { EmployerNotificationsBell } from "./employer-notifications-bell";
import { Logo } from "./logo";
import { User } from "@/lib/auth";
import { usePreview } from "@/lib/preview-context";
import { isAdmin } from "@/lib/roles";

interface NavbarClientProps {
  user?: User | null;
  roles?: string[];
  role?: string | null;
}

export function NavbarClient({ user: userProp, roles: rolesProp, role: roleProp }: NavbarClientProps = {}) {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { preview } = usePreview();
  const user = userProp ?? session?.user;
  const roles = rolesProp ?? session?.user?.roles ?? [];
  const role = roleProp ?? session?.user?.role ?? roles[0] ?? null;
  const showAdmin = isAdmin(role) || roles.some((r: string) => isAdmin(r));
  const impersonating = Boolean(
    (session as { impersonating?: boolean })?.impersonating
  );
  const eliteDemo = Boolean(preview?.demoActive);
  const pathname = usePathname();
  const isEmployerArea = pathname?.startsWith("/employer");
  const [complianceCount, setComplianceCount] = useState(0);

  useEffect(() => {
    if (!isEmployerArea || !user || !roles?.includes("employer")) {
      setComplianceCount(0);
      return;
    }
    fetch("/api/employer/compliance-badge")
      .then((r) => r.json())
      .then((data: { count?: number }) => setComplianceCount(data?.count ?? 0))
      .catch(() => setComplianceCount(0));
  }, [isEmployerArea, user?.id, roles]);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white shadow-sm py-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="xl" showText={false} />
            {eliteDemo && (
              <span className="rounded bg-violet-600/90 px-2 py-0.5 text-xs font-medium text-white">
                Elite Demo
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 justify-end">
            {impersonating && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await update({ stopImpersonation: true });
                  router.push("/admin");
                }}
                className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
              >
                Exit Impersonation
              </Button>
            )}
            <ThemeToggle />

            {status === "loading" ? (
              <span className="text-sm text-[#64748B]">Loading...</span>
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
                {isEmployerArea ? <EmployerNotificationsBell /> : <NotificationsBell />}
                <Button variant="ghost" size="sm" href="/pricing" className="hover:bg-grey-background dark:hover:bg-[#1A1F2B]">
                  Pricing
                </Button>
                {showAdmin && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      href="/admin"
                      className="font-semibold text-primary dark:text-blue-400 hover:bg-grey-background dark:hover:bg-[#1A1F2B]"
                    >
                      Admin Panel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      href="/admin/sandbox-v2"
                      className="font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-grey-background dark:hover:bg-[#1A1F2B]"
                    >
                      Enterprise Simulation
                    </Button>
                  </>
                )}
                {(roles.includes("employer") || roles.includes("superadmin")) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    href="/employer/dashboard"
                    className="font-semibold hover:bg-grey-background dark:hover:bg-[#1A1F2B] relative"
                  >
                    Employer Panel
                    {isEmployerArea && complianceCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                        {complianceCount > 99 ? "99+" : complianceCount}
                      </span>
                    )}
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
                <Button variant="ghost" size="sm" href="/login" className="hover:bg-grey-background dark:hover:bg-[#1A1F2B]">
                  Sign In
                </Button>
                <Button size="sm" href="/signup">
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
