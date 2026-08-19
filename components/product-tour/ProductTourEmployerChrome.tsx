"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  Users,
  BookUser,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", Icon: LayoutDashboard, active: false },
  { label: "Search", Icon: Search, active: false },
  { label: "Verified candidates", Icon: Users, active: false },
  { label: "Directory", Icon: BookUser, active: false },
  { label: "Settings", Icon: Settings, active: false },
] as const;

type Props = {
  children: React.ReactNode;
  highlight?: "dashboard" | "search";
};

/** Static employer chrome for the product tour — mirrors EmployerPortalLayout without live routes. */
export function ProductTourEmployerChrome({ children, highlight }: Props) {
  const items = NAV_ITEMS.map((item) => ({
    ...item,
    active:
      (highlight === "dashboard" && item.label === "Dashboard") ||
      (highlight === "search" && item.label === "Search"),
  }));

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] bg-wv-bg text-wv-foreground">
      <aside className="relative z-20 hidden w-56 shrink-0 flex-col border-r border-wv-border bg-wv-surface/80 backdrop-blur-xl md:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-wv-border px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 text-xs font-bold text-white shadow-md">
              EP
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">Employer Panel</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-wv-subtle">
                WorkVouch
              </p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Employer navigation (demo)">
          {items.map(({ label, Icon, active }) => (
            <span
              key={label}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                active
                  ? "bg-white/10 text-white ring-1 ring-white/15"
                  : "text-wv-muted",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              {label}
            </span>
          ))}
        </nav>
      </aside>
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center border-b border-wv-border px-4 md:px-6">
          <p className="text-sm text-wv-muted">Summit Staffing Partners</p>
        </div>
        <div className="flex-1 overflow-x-hidden px-4 py-6 md:px-6 md:py-8">{children}</div>
      </div>
    </div>
  );
}
