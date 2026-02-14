"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

interface AdminSidebarProps {
  isSuperAdmin: boolean;
}

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
  ],
  Sandbox: [
    { href: "/admin/sandbox/enter", label: "Enter Sandbox" },
    { href: "/admin/sandbox-v2", label: "Sandbox" },
    { href: "/admin/simulate", label: "Simulate" },
  ],
  Analytics: [
    { href: "/admin/analytics/overview", label: "Overview" },
    { href: "/admin/analytics/real-time", label: "Real-Time" },
    { href: "/admin/analytics/geography", label: "Geography" },
    { href: "/admin/analytics/funnels", label: "Funnels" },
    { href: "/admin/analytics/heatmaps", label: "Heatmaps" },
    { href: "/admin/analytics/journeys", label: "User Journeys" },
    { href: "/admin/analytics/abuse", label: "Abuse & Security" },
    { href: "/admin/analytics/sandbox", label: "Sandbox Analytics" },
  ],
  Alerts: [{ href: "/admin/alerts", label: "Alerts" }],
  Incidents: [{ href: "/admin/incidents", label: "Incidents" }],
  AuditLogs: [{ href: "/admin/audit-logs", label: "Audit Logs" }],
  SystemSettings: [{ href: "/admin/system", label: "System Settings" }],
};

export function AdminSidebar({ isSuperAdmin }: AdminSidebarProps) {
  const pathname = usePathname();

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
          {section("Dashboard", nav.Dashboard)}
          {section("Users", nav.Users)}
          {section("Employers", nav.Employers)}
          {section("Reviews & Trust", nav.ReviewsAndTrust)}
          {section("Sandbox", nav.Sandbox)}
          {section("Analytics", nav.Analytics)}
          {section("Alerts", nav.Alerts)}
          {section("Incidents", nav.Incidents)}
          {section("Audit Logs", nav.AuditLogs)}
          {isSuperAdmin && section("System Settings", nav.SystemSettings)}
        </nav>
      </div>
    </aside>
  );
}
