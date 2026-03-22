"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCanUseDangerousAdmin } from "@/lib/admin/adminPowerGate";

const SIDEBAR_BG = "bg-white";
const BORDER = "border-[#E2E8F0]";
const LINK_ACTIVE = "bg-slate-100 text-[#0F172A] border-l-2 border-[#2563EB]";
const LINK_INACTIVE = "text-[#334155] hover:bg-slate-50 hover:text-[#0F172A] border-l-2 border-transparent";
const SECTION_TITLE = "text-[#64748B] text-xs font-semibold uppercase tracking-wider";

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/admin") return false;
  return pathname.startsWith(href + "/");
}

export type AppEnvironment = "production" | "sandbox";

export interface AdminSidebarProps {
  isSuperAdmin: boolean;
  /** When true, show sandbox nav and amber styling. Must be true to show Playground, Abuse, Generators. */
  isSandbox: boolean;
  /** Environment-based. Production = metrics-only; sandbox = full power tools. */
  appEnvironment?: AppEnvironment;
  /** When true (production + founder override active), show full power nav like sandbox. */
  overrideActive?: boolean;
  /** When true, show Financials nav (finance | admin | board). */
  showFinancials: boolean;
  /** When true, show Board nav (board | admin). */
  showBoard: boolean;
}

const controlCenterNav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/trust", label: "Trust" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/matches", label: "Matches" },
];

/** Simulation is under System Controls (playground). */
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

/** Product / journey previews — all admins (read-only UI). */
const productToolsNav = [{ href: "/admin/flows", label: "Flow Viewer" }];

/** Sandbox-only nav: Trust Overview, Members, Lab Environment (simulation), Audit Logs. */
const sandboxNav = {
  TrustOverview: nav.TrustOverview,
  Users: nav.Users,
  LabEnvironment: nav.LabEnvironment,
  AuditLogs: nav.AuditLogs,
};

/** Production admin: read-only nav (no Lab Environment, Abuse, Generators, mutation tools). */
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

export function AdminSidebar({ isSuperAdmin, isSandbox = false, appEnvironment = "production", overrideActive = false, showFinancials = false, showBoard = false }: AdminSidebarProps) {
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
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(pathname, item.href) ? LINK_ACTIVE : LINK_INACTIVE
              }`}
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
      className={`w-64 min-h-screen ${SIDEBAR_BG} border-r ${BORDER} flex-shrink-0`}
      aria-label="Admin navigation"
    >
      <div className="sticky top-0 flex flex-col h-screen py-4">
        <Link
          href="/admin"
          className={`px-4 py-2 mx-2 rounded-lg font-semibold border-l-2 border-transparent ${
            pathname === "/admin" ? LINK_ACTIVE : "text-[#334155] hover:bg-slate-50"
          }`}
        >
          Home
        </Link>
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
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive(pathname, item.href) ? LINK_ACTIVE : LINK_INACTIVE
                      }`}
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
                  : [{ href: "/admin/signups", label: "Signups" }]
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
