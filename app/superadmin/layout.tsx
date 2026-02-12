import Link from "next/link";
import { SandboxBanner } from "@/components/workforce/SandboxBanner";

export const dynamic = "force-dynamic";

const SIDEBAR = [
  { href: "/superadmin", label: "Control Center" },
  { href: "/superadmin/roles", label: "Manage Roles" },
  { href: "/superadmin/organizations", label: "All Organizations" },
  { href: "/superadmin/usage", label: "Usage Metrics" },
  { href: "/superadmin/environment", label: "Environment Switcher" },
  { href: "/superadmin/resume-failures", label: "Resume Failures" },
  { href: "/superadmin/flagged", label: "Flagged Activity" },
  { href: "/superadmin/billing", label: "Billing Control" },
  { href: "/superadmin/impersonate", label: "Impersonate User" },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1117]">
      <SandboxBanner />
      <div className="flex">
        <aside className="w-56 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 min-h-screen py-4 px-3">
          <h2 className="font-semibold text-red-600 dark:text-red-400 mb-4 px-2">Super Admin</h2>
          <nav className="space-y-0.5">
            {SIDEBAR.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block py-2 px-3 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
