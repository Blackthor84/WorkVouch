"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Users,
  FileUp,
  MessageSquareQuote,
  BarChart3,
  CreditCard,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "overview", label: "Overview", Icon: LayoutDashboard },
  { href: "locations", label: "Locations", Icon: MapPin },
  { href: "employees", label: "Employees", Icon: Users },
  { href: "resume-imports", label: "Resume Imports", Icon: FileUp },
  { href: "peer-references", label: "Peer References", Icon: MessageSquareQuote },
  { href: "analytics", label: "Analytics", Icon: BarChart3 },
  { href: "billing", label: "Billing", Icon: CreditCard },
  { href: "admin-controls", label: "Admin Controls", Icon: Shield },
] as const;

function itemPath(orgId: string, href: (typeof ITEMS)[number]["href"]) {
  return href === "overview"
    ? `/enterprise/${orgId}/overview`
    : `/enterprise/${orgId}/${href}`;
}

export function EnterpriseOrgSidebarNav({ orgId }: { orgId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Organization navigation">
      {ITEMS.map(({ href, label, Icon }) => {
        const to = itemPath(orgId, href);
        const isActive = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={href}
            href={to}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white ring-1 ring-indigo-500/30"
                : "text-wv-muted hover:bg-wv-surface hover:text-wv-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
