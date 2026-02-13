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
  Users: [
    { href: "/admin/users", label: "Manage Users" },
    { href: "/admin/signups", label: "Signups" },
  ],
  Employers: [
    { href: "/admin/claim-requests", label: "Claim Requests" },
    { href: "/admin/employer-usage", label: "Employer Usage" },
  ],
  Intelligence: [
    { href: "/admin/intelligence-dashboard", label: "Intelligence Dashboard" },
    { href: "/admin/intelligence-preview", label: "Intelligence Preview" },
    { href: "/admin/intelligence-health", label: "Integrity Health" },
    { href: "/admin/employer-reputation-preview", label: "Employer Reputation" },
  ],
  Sandbox: [
    { href: "/admin/sandbox-v2", label: "Enterprise Simulation" },
    { href: "/admin/preview", label: "Preview Panel" },
    { href: "/admin/preview-control", label: "Preview & Simulation Control" },
    { href: "/admin/beta", label: "Beta Access" },
    { href: "/admin/investor-sandbox", label: "Investor Sandbox" },
    { href: "/admin/testing-lab", label: "Testing Lab" },
    { href: "/admin/simulate", label: "Simulate" },
    { href: "/admin/intelligence-sandbox", label: "Intelligence Sandbox" },
  ],
  System: [
    { href: "/admin/disputes", label: "Disputes" },
    { href: "/admin/verifications", label: "Verifications" },
    { href: "/admin/export", label: "Data Export" },
    { href: "/admin/ads", label: "Ads Manager" },
    { href: "/admin/fraud", label: "Fraud Dashboard" },
    { href: "/admin/fraud-workflow", label: "Fraud Workflow" },
    { href: "/admin/vertical-control", label: "Vertical Control" },
    { href: "/admin/system", label: "System Panel" },
    { href: "/admin/hidden-features", label: "Hidden Features" },
    { href: "/admin/scale-metrics", label: "Scale Metrics" },
    { href: "/admin/superadmin", label: "Superadmin Control" },
  ],
};

export function AdminSidebar({ isSuperAdmin }: AdminSidebarProps) {
  const pathname = usePathname();

  const systemLinks = nav.System.filter((item) => {
    if (item.href === "/admin/system" || item.href === "/admin/hidden-features" || item.href === "/admin/scale-metrics" || item.href === "/admin/superadmin") {
      return isSuperAdmin;
    }
    return true;
  });

  const sandboxLinks = [
    ...nav.Sandbox,
    ...(isSuperAdmin ? [{ href: "/admin/investor", label: "Investor Dashboard" }] : []),
  ];

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
          Admin Overview
        </Link>
        <nav className="flex-1 overflow-y-auto mt-4 space-y-6 px-2">
          <div>
            <div className={`px-3 py-1.5 ${SECTION_TITLE}`}>Users</div>
            <ul className="mt-1 space-y-0.5">
              {nav.Users.map((item) => (
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
          <div>
            <div className={`px-3 py-1.5 ${SECTION_TITLE}`}>Employers</div>
            <ul className="mt-1 space-y-0.5">
              {nav.Employers.map((item) => (
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
          <div>
            <div className={`px-3 py-1.5 ${SECTION_TITLE}`}>Intelligence</div>
            <ul className="mt-1 space-y-0.5">
              {nav.Intelligence.map((item) => (
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
          <div>
            <div className={`px-3 py-1.5 ${SECTION_TITLE}`}>Sandbox</div>
            <ul className="mt-1 space-y-0.5">
              {sandboxLinks.map((item) => (
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
          <div>
            <div className={`px-3 py-1.5 ${SECTION_TITLE}`}>System</div>
            <ul className="mt-1 space-y-0.5">
              {systemLinks.map((item) => (
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
        </nav>
      </div>
    </aside>
  );
}
