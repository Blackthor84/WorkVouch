"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsBell } from "./notifications-bell";
import { EmployerNotificationsBell } from "./employer-notifications-bell";
import { Logo } from "./logo";
import { User } from "@/lib/auth";
import { usePreview } from "@/lib/preview-context";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";
import { useAuth } from "@/components/AuthContext";
import { supabaseBrowser } from "@/lib/supabase/browser";

export interface OrgSwitcherItem {
  id: string;
  name: string;
  type: "organization" | "location";
  organizationId?: string;
}

export interface NavbarClientProps {
  user?: User | null;
  role?: string | null;
  /** Server-computed: show Admin link (never crashes navbar). */
  showAdmin?: boolean;
  /** Server-computed: show Sandbox link (superadmin only). */
  showSandboxAdmin?: boolean;
  /** When org_admin/enterprise_owner: list of orgs/locations for switcher dropdown. */
  orgSwitcherItems?: OrgSwitcherItem[] | null;
  /** True when admin is viewing as another user (from server). */
  impersonating?: boolean;
}

function AuthenticatedNavbar({
  user,
  role,
  router,
  pathname,
  orgSwitcherItems,
  showAdmin,
  showSandboxAdmin,
  complianceCount,
  isEmployerArea,
}: {
  user: User;
  role: string | null;
  router: ReturnType<typeof useRouter>;
  pathname: string | null;
  orgSwitcherItems: OrgSwitcherItem[] | null | undefined;
  showAdmin: boolean;
  showSandboxAdmin: boolean;
  complianceCount: number;
  isEmployerArea: boolean;
}) {
  const showOrgSwitcher = Boolean(orgSwitcherItems?.length);
  return (
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
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            Admin
          </Button>
        </Link>
      )}
      {showOrgSwitcher && orgSwitcherItems && (
        <select
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white px-2 py-1"
          value=""
          onChange={(e) => {
            const v = e.target.value;
            if (v) router.push(v);
          }}
        >
          <option value="">Organization / Location</option>
          {orgSwitcherItems.map((item: OrgSwitcherItem) => (
            <option
              key={item.type === "organization" ? item.id : `${item.organizationId}-${item.id}`}
              value={item.type === "organization" ? `/admin/organization/${item.id}` : `/enterprise/${item.organizationId}/locations/${item.id}`}
            >
              {item.name} {item.type === "location" ? "(location)" : ""}
            </option>
          ))}
        </select>
      )}
      {showSandboxAdmin && (
        <Button
          variant="ghost"
          size="sm"
          href="/admin"
          className="font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-grey-background dark:hover:bg-[#1A1F2B]"
        >
          Sandbox
        </Button>
      )}
      {(role === "employer" || role === "superadmin" || role === "super_admin") && (
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
        onClick={async () => {
          try {
            await fetch("/api/admin/impersonate/exit", { method: "POST", credentials: "include" });
          } catch {
            // ignore
          }
          await supabaseBrowser.auth.signOut();
          router.push("/");
          router.refresh();
        }}
        className="hover:bg-grey-background dark:hover:bg-[#1A1F2B]"
      >
        Logout
      </Button>
    </div>
  );
}

export function NavbarClient({ user: userProp, role: roleProp, orgSwitcherItems, impersonating: impersonatingProp }: NavbarClientProps = {}) {
  const session = null as { user?: User } | null;
  const status = "authenticated" as "loading" | "authenticated" | "unauthenticated";
  const authRole: string | null = null;
  const authLoading = false;
  const preview = null as { demoActive?: boolean } | null;
  const router = useRouter();
  const pathname = usePathname();

  const resolvedUser = userProp ?? session?.user ?? null;
  const resolvedRole = authLoading ? null : (authRole ?? roleProp ?? null);
  const isAuthenticated = status === "authenticated" && resolvedUser !== null;

  const impersonating = Boolean(impersonatingProp ?? (session as { impersonating?: boolean } | null)?.impersonating);
  const eliteDemo = Boolean(preview?.demoActive);
  const isEmployerArea = pathname?.startsWith("/employer");
  const [complianceCount, setComplianceCount] = useState(0);

  useEffect(() => {
    if (!isEmployerArea || !resolvedUser || resolvedRole !== "employer") {
      setComplianceCount(0);
      return;
    }
    fetch("/api/employer/compliance-badge")
      .then((r) => r.json())
      .then((data: { count?: number }) => setComplianceCount(data?.count ?? 0))
      .catch(() => setComplianceCount(0));
  }, [isEmployerArea, resolvedUser?.id, resolvedRole]);

  const roleFromMetadata = (session?.user as { app_metadata?: { role?: string } } | undefined)?.app_metadata?.role;
  const showAdmin =
    !!session &&
    roleFromMetadata != null &&
    ["admin", "superadmin"].includes(String(roleFromMetadata).toLowerCase());
  const showSandboxAdmin = String(roleFromMetadata ?? "").toLowerCase() === "superadmin";

  return (
    <nav className="sticky top-0 z-50 h-14 flex items-center border-b border-[#E2E8F0] bg-white shadow-sm">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <Logo size="xl" showText={false} />
          {eliteDemo && (
            <span className="rounded bg-violet-600/90 px-2 py-0.5 text-xs font-medium text-white flex-shrink-0">
              Elite Demo
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 justify-end flex-shrink-0 min-w-0">
            {impersonating && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await fetch("/api/admin/impersonate/exit", { method: "POST" });
                  router.push("/admin");
                }}
                className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
              >
                Exit Impersonation
              </Button>
            )}
            <ThemeToggle />

            {status === "loading" && (
              <span className="text-sm text-[#64748B]">Loading...</span>
            )}

            {status !== "loading" && !isAuthenticated && (
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

            {status !== "loading" && isAuthenticated && resolvedUser && (
              <AuthenticatedNavbar
                user={resolvedUser}
                role={resolvedRole}
                router={router}
                pathname={pathname}
                orgSwitcherItems={orgSwitcherItems ?? null}
                showAdmin={showAdmin}
                showSandboxAdmin={showSandboxAdmin}
                complianceCount={complianceCount}
                isEmployerArea={isEmployerArea}
              />
            )}
        </div>
      </div>
    </nav>
  );
}
