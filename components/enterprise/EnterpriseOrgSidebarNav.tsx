"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "overview", label: "Overview" },
  { href: "locations", label: "Locations" },
  { href: "employees", label: "Employees" },
  { href: "resume-imports", label: "Resume Imports" },
  { href: "peer-references", label: "Peer References" },
  { href: "analytics", label: "Analytics" },
  { href: "billing", label: "Billing" },
  { href: "admin-controls", label: "Admin Controls" },
] as const;

function itemPath(orgId: string, href: (typeof ITEMS)[number]["href"]) {
  return href === "overview"
    ? `/enterprise/${orgId}/overview`
    : `/enterprise/${orgId}/${href}`;
}

export function EnterpriseOrgSidebarNav({ orgId }: { orgId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {ITEMS.map(({ href, label }) => {
        const to = itemPath(orgId, href);
        const isActive = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={href}
            href={to}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-blue-600 text-white" : "text-blue-800 hover:bg-blue-100",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
