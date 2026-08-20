"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Link2,
  History,
  Activity,
  HeartPulse,
  Settings,
  RotateCcw,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/employer/integrations", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/employer/integrations/connect", label: "Connect", Icon: Link2 },
  { href: "/employer/integrations/greenhouse", label: "Greenhouse", Icon: GitBranch },
  { href: "/employer/integrations/sync", label: "Sync History", Icon: History },
  { href: "/employer/integrations/events", label: "Events", Icon: Activity },
  { href: "/employer/integrations/health", label: "Health", Icon: HeartPulse },
  { href: "/employer/integrations/settings", label: "Automation", Icon: Settings },
  { href: "/employer/integrations/replay", label: "Replay", Icon: RotateCcw },
];

export function IntegrationSubNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const connectionId = searchParams.get("connectionId");
  const qs = connectionId ? `?connectionId=${connectionId}` : "";

  return (
    <nav className="mb-8 flex flex-wrap gap-2" aria-label="Integration sections">
      {navItems.map((item) => {
        const href = `${item.href}${qs}`;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname?.startsWith(item.href + "/");
        const { Icon } = item;
        return (
          <Link
            key={item.href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-violet-500/40 bg-violet-500/10 text-white"
                : "border-wv-border bg-wv-surface/50 text-wv-muted hover:text-wv-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function useConnectionId(fallback?: string) {
  const searchParams = useSearchParams();
  return searchParams.get("connectionId") ?? fallback ?? "";
}

export function formatRelativeTime(iso?: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function statusBadgeVariant(status: string): "success" | "warning" | "danger" | "default" {
  if (status === "connected" || status === "healthy") return "success";
  if (status === "pending" || status === "degraded") return "warning";
  if (status === "error" || status === "expired" || status === "unhealthy" || status === "disconnected") return "danger";
  return "default";
}
