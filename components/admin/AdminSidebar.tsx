"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getCanUseDangerousAdmin } from "@/lib/admin/adminPowerGate";

const SECTION_TITLE = "text-wv-subtle text-xs font-semibold uppercase tracking-wider";

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/admin") return false;
  return pathname.startsWith(href + "/");
}

export type AppEnvironment = "production" | "sandbox";

export interface AdminSidebarProps {
  isSuperAdmin: boolean;
  isSandbox?: boolean;
  appEnvironment?: AppEnvironment;
  overrideActive?: boolean;
  showFinancials: boolean;
  showBoard: boolean;
}

const controlCenterNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/trust", label: "Trust" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/matches", label: "Matches" },
];

const nav = {
  TrustOverview: [{ href: "/admin", label: "Trust Overview" }],
  Users: [
    { href: "/admin/users", label: "Members" },
    { href: "/admin/signups", label: "Signups" },
  ],
  Employers: [
    { href: "/admin/organizations", label: "Employers" },
    { href: "/admin/claim-requests", label: "Claim Requests" },
    { href: "/admin/employer-usage", label: "Employer Usage" },
  ],
  IntegrityReview: [
    { href: "/admin/reviews", label: "Reviews" },
    { href: "/admin/flagged-content", label: "Flagged Content" },
    { href: "/admin/trust-scores", label: "Trust Bands" },
    { href: "/admin/scoring-explained", label: "Scoring Explained" },
  ],
  LabEnvironment: [
    { href: "/admin/playground", label: "System Controls" },
    { href: "/admin/playground/monitor", label: "Activity monitor" },
  ],
  Analytics: [
    { href: "/admin/analytics/overview", label: "Overview" },
    { href: "/admin/analytics/real-time", label: "Real-Time" },
    { href: "/admin/analytics/geography", label: "Geography" },
    { href: "/admin/analytics/funnels", label: "Funnels" },
    { href: "/admin/analytics/heatmaps", label: "Heatmaps" },
    { href: "/admin/analytics/journeys", label: "Member Journeys" },
    { href: "/admin/analytics/abuse", label: "Abuse & Security" },
    { href: "/admin/analytics/sandbox", label: "Simulation Analytics" },
  ],
  Alerts: [{ href: "/admin/alerts", label: "Alerts" }],
  Incidents: [{ href: "/admin/incidents", label: "Incidents" }],
  AuditLogs: [{ href: "/admin/audit-logs", label: "Audit Logs" }],
  Financials: [{ href: "/admin/financials", label: "Financials" }],
  Board: [{ href: "/admin/board", label: "Board" }],
  SystemIntegrity: [{ href: "/admin/system-health", label: "System Integrity" }],
  AccessControls: [{ href: "/admin/preview-control", label: "Access Controls" }],
  SystemSettings: [{ href: "/admin/system", label: "System Settings" }],
};

const enterpriseNav = [
  { label: "Companies", href: "/admin/enterprise/companies" },
  { label: "Plans", href: "/admin/enterprise/plans" },
  { label: "Billing", href: "/admin/enterprise/billing" },
];

const productToolsNav = [{ href: "/admin/flows", label: "Flow Viewer" }];

const sandboxNav = {
  TrustOverview: nav.TrustOverview,
  Users: nav.Users,
  LabEnvironment: nav.LabEnvironment,
  AuditLogs: nav.AuditLogs,
};

const productionOnlyNav = {
  TrustOverview: nav.TrustOverview,
  Users: nav.Users,
  Employers: nav.Employers,
  IntegrityReview: nav.IntegrityReview,
  Analytics: [
    { href: "/admin/analytics/overview", label: "Overview" },
    { href: "/admin/analytics/real-time", label: "Real-Time" },
    { href: "/admin/analytics/geography", label: "Geography" },
    { href: "/admin/analytics/funnels", label: "Funnels" },
    { href: "/admin/analytics/heatmaps", label: "Heatmaps" },
    { href: "/admin/analytics/journeys", label: "Member Journeys" },
    { href: "/admin/analytics/abuse", label: "Abuse & Security" },
  ],
  Alerts: nav.Alerts,
  Incidents: nav.Incidents,
  AuditLogs: nav.AuditLogs,
  Financials: nav.Financials,
  Board: nav.Board,
  SystemIntegrity: nav.SystemIntegrity,
  AccessControls: nav.AccessControls,
  SystemSettings: nav.SystemSettings,
};

export function AdminSidebar({
  isSuperAdmin,
  isSandbox = false,
  overrideActive = false,
  showFinancials = false,
  showBoard = false,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const canUseDangerousAdmin = getCanUseDangerousAdmin(overrideActive);
  const showFullPowerNav = canUseDangerousAdmin;

  const section = (title: string, items: { href: string; label: string }[]) => (
    <div key={title}>
      <div className={`px-3 py-1.5 ${SECTION_TITLE}`}>{title}</div>
      <ul className="mt-1 space-y-0.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive(pathname ?? "", item.href) ? "page" : undefined}
              className={cn(
                "block rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive(pathname ?? "", item.href)
                  ? "bg-gradient-to-r from-red-500/20 to-orange-500/10 text-white ring-1 ring-red-500/30"
                  : "text-wv-muted hover:bg-wv-surface hover:text-wv-foreground",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <aside
      className="w-64 min-h-screen border-r border-wv-border bg-wv-surface/80 backdrop-blur-xl flex-shrink-0"
      aria-label="Admin navigation"
    >
      <div className="sticky top-0 flex flex-col h-screen py-4">
        <div className="px-4 pb-3 border-b border-wv-border mx-2">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-600 text-xs font-bold text-white shadow-md">
              AD
            </span>
            <div>
              <p className="text-sm font-bold text-wv-foreground">Admin</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-wv-subtle">
                {isSandbox ? "Sandbox" : "Control"}
              </p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto mt-4 space-y-6 px-2">
          {isSuperAdmin && section("Control Center", controlCenterNav)}
          {isSuperAdmin && !showFullPowerNav && (
            <div>
              <div className={`px-3 py-1.5 ${SECTION_TITLE}`}>Enterprise</div>
              <ul className="mt-1 space-y-0.5">
                {enterpriseNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                        isActive(pathname ?? "", item.href)
                          ? "bg-gradient-to-r from-red-500/20 to-orange-500/10 text-white ring-1 ring-red-500/30"
                          : "text-wv-muted hover:bg-wv-surface hover:text-wv-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showFullPowerNav ? (
            <>
              {section("Trust Overview", sandboxNav.TrustOverview)}
              {section("Members", sandboxNav.Users)}
              {section("Product tools", productToolsNav)}
              {section("System Controls", sandboxNav.LabEnvironment)}
              {section("Audit Logs", sandboxNav.AuditLogs)}
            </>
          ) : (
            <>
              {section("Trust Overview", productionOnlyNav.TrustOverview)}
              {section("Product tools", productToolsNav)}
              {section(
                "Members",
                isSuperAdmin
                  ? productionOnlyNav.Users
                  : [{ href: "/admin/signups", label: "Signups" }],
              )}
              {section("Employers", productionOnlyNav.Employers)}
              {section("Integrity Review", productionOnlyNav.IntegrityReview)}
              {section("Analytics", productionOnlyNav.Analytics)}
              {section("Alerts", productionOnlyNav.Alerts)}
              {section("Incidents", productionOnlyNav.Incidents)}
              {section("Audit Logs", productionOnlyNav.AuditLogs)}
              {showFinancials && section("Financials", productionOnlyNav.Financials)}
              {showBoard && section("Board", productionOnlyNav.Board)}
              {section("System Integrity", productionOnlyNav.SystemIntegrity)}
              {section("Access Controls", productionOnlyNav.AccessControls)}
              {isSuperAdmin && section("System Controls", sandboxNav.LabEnvironment)}
              {isSuperAdmin && section("System Settings", productionOnlyNav.SystemSettings)}
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}
