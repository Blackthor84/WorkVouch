"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GitCompare,
  Building2,
  BookUser,
  Search,
  MessageSquare,
  CreditCard,
  Settings,
  Bookmark,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/employer/dashboard", label: "Verification Summary", Icon: LayoutDashboard },
  { href: "/employer/verified-workers", label: "Verified workers", Icon: Users },
  { href: "/employer/compare", label: "Decision Comparison", Icon: GitCompare },
  { href: "/employer/claim", label: "Claim company", Icon: Building2 },
  { href: "/employer/directory", label: "Directory", Icon: BookUser },
  { href: "/employer/candidates", label: "Candidates", Icon: Search },
  { href: "/employer/candidates", label: "Saved Profiles", Icon: Bookmark },
  { href: "/employer/dashboard", label: "Hiring Confidence", Icon: BarChart3 },
  { href: "/employer/messages", label: "Messages", Icon: MessageSquare },
  { href: "/employer/billing", label: "Billing", Icon: CreditCard },
  { href: "/employer/settings", label: "Settings", Icon: Settings },
];

export function EmployerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-20 hidden w-64 shrink-0 flex-col border-r border-wv-border bg-wv-surface/80 backdrop-blur-xl md:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-wv-border px-4">
        <Link href="/employer/dashboard" className="flex items-center gap-2.5 rounded-lg" aria-label="Employer dashboard">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-xs font-bold text-white shadow-md">
            EP
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-wv-foreground truncate">Employer Panel</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-wv-subtle">WorkVouch</p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Employer navigation">
        {navItems.map((item) => {
          const { Icon } = item;
          const isActive =
            pathname === item.href ||
            (item.href !== "/employer/dashboard" && pathname?.startsWith(item.href + "/"));
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-violet-500/20 to-blue-500/10 text-white ring-1 ring-violet-500/30"
                  : "text-wv-muted hover:bg-wv-surface hover:text-wv-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
