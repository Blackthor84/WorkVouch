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

interface AdminSidebarProps {
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

/** Simulation is under Playground only (no top-level "Sandbox" nav). Do not re-add Sandbox as a destination. */
const nav = {
  Dashboard: [{ href: "/admin", label: "Dashboard" }],
  Users: [
    { href: "/admin/users", label: "Users" },
    { href: "/admin/signups", label: "Signups" },
  ],
  Employers: [
    { href: "/admin/organizations", label: "Employers" },
    { href: "/admin/claim-requests", label: "Claim Requests" },
    { href: "/admin/employer-usage", label: "Employer Usage" },
  ],
  ReviewsAndTrust: [
    { href: "/admin/reviews", label: "Reviews & Moderation" },
    { href: "/admin/trust-scores", label: "Trust Scores" },
    { href: "/admin/scoring-explained", label: "Scoring Explained" },
  ],
  Playground: [
    { href: "/admin/playground", label: "Playground" },
    { href: "/admin/playground/monitor", label: "Activity Monitor" },
  ],
  Analytics: [
    { href: "/admin/analytics/overview", label: "Overview" },
    { href: "/admin/analytics/real-time", label: "Real-Time" },
    { href: "/admin/analytics/geography", label: "Geography" },
    { href: "/admin/analytics/funnels", label: "Funnels" },
    { href: "/admin/analytics/heatmaps", label: "Heatmaps" },
    { href: "/admin/analytics/journeys", label: "User Journeys" },
    { href: "/admin/analytics/abuse", label: "Abuse & Security" },
    { href: "/admin/analytics/sandbox", label: "Simulation Analytics" },
  ],
  Alerts: [{ href: "/admin/alerts", label: "Alerts" }],
  Incidents: [{ href: "/admin/incidents", label: "Incidents" }],
  AuditLogs: [{ href: "/admin/audit-logs", label: "Audit Logs" }],
  Financials: [{ href: "/admin/financials", label: "Financials" }],
  Board: [{ href: "/admin/board", label: "Board" }],
  SystemSettings: [{ href: "/admin/system", label: "System Settings" }],
};

const enterpriseNav = [
  { label: "Companies", href: "/admin/enterprise/companies" },
  { label: "Plans", href: "/admin/enterprise/plans" },
  { label: "Billing", href: "/admin/enterprise/billing" },
];

/** Sandbox-only nav: Dashboard, Users, Playground (simulation), Audit Logs. */
const sandboxNav = {
  Dashboard: nav.Dashboard,
  Users: nav.Users,
  Playground: nav.Playground,
  AuditLogs: nav.AuditLogs,
};

/** Production admin: read-only nav (no Playground, Abuse, Generators, mutation tools). */
const productionOnlyNav = {
  Dashboard: [{ href: "/admin", label: "Dashboard" }],
  Users: [
    { href: "/admin/users", label: "Users" },
    { href: "/admin/signups", label: "Signups" },
  ],
  Employers: [
    { href: "/admin/organizations", label: "Employers" },
    { href: "/admin/claim-requests", label: "Claim Requests" },
    { href: "/admin/employer-usage", label: "Employer Usage" },
  ],
  ReviewsAndTrust: [
    { href: "/admin/reviews", label: "Reviews & Moderation" },
    { href: "/admin/trust-scores", label: "Trust Scores" },
    { href: "/admin/scoring-explained", label: "Scoring Explained" },
  ],
  Analytics: [
    { href: "/admin/analytics/overview", label: "Overview" },
    { href: "/admin/analytics/real-time", label: "Real-Time" },
    { href: "/admin/analytics/geography", label: "Geography" },
    { href: "/admin/analytics/funnels", label: "Funnels" },
    { href: "/admin/analytics/heatmaps", label: "Heatmaps" },
    { href: "/admin/analytics/journeys", label: "User Journeys" },
    { href: "/admin/analytics/abuse", label: "Abuse & Security" },
  ],
  Alerts: [{ href: "/admin/alerts", label: "Alerts" }],
  Incidents: [{ href: "/admin/incidents", label: "Incidents" }],
  AuditLogs: [{ href: "/admin/audit-logs", label: "Audit Logs" }],
  Financials: [{ href: "/admin/financials", label: "Financials" }],
  Board: [{ href: "/admin/board", label: "Board" }],
  SystemSettings: [{ href: "/admin/system", label: "System Settings" }],
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
          Dashboard
        </Link>
        <nav className="flex-1 overflow-y-auto mt-4 space-y-6 px-2">
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
              {section("Dashboard", sandboxNav.Dashboard)}
              {section("Users", sandboxNav.Users)}
              {section("Sandbox", sandboxNav.Sandbox)}
              {section("Audit Logs", sandboxNav.AuditLogs)}
            </>
          ) : (
            <>
              {section("Dashboard", productionOnlyNav.Dashboard)}
              {section("Users", productionOnlyNav.Users)}
              {section("Employers", productionOnlyNav.Employers)}
              {section("Reviews & Trust", productionOnlyNav.ReviewsAndTrust)}
              {section("Analytics", productionOnlyNav.Analytics)}
              {section("Alerts", productionOnlyNav.Alerts)}
              {section("Incidents", productionOnlyNav.Incidents)}
              {section("Audit Logs", productionOnlyNav.AuditLogs)}
              {showFinancials && section("Financials", productionOnlyNav.Financials)}
              {showBoard && section("Board", productionOnlyNav.Board)}
              {isSuperAdmin && section("Playground", sandboxNav.Playground)}
              {isSuperAdmin && section("System Settings", productionOnlyNav.SystemSettings)}
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}
