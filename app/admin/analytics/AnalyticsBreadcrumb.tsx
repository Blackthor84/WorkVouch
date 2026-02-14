"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  overview: "Overview",
  "real-time": "Real-Time",
  geography: "Geography",
  funnels: "Funnels",
  heatmaps: "Heatmaps",
  journeys: "User Journeys",
  abuse: "Abuse & Security",
  sandbox: "Sandbox Analytics",
};

export function AnalyticsBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname?.replace(/^\/admin\/analytics\/?/, "").split("/").filter(Boolean) ?? [];
  const current = segments[0];
  const label = current ? (SEGMENT_LABELS[current] ?? current) : "Analytics";

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-600">
      <Link href="/admin" className="hover:text-slate-900">Admin</Link>
      <span className="mx-2">/</span>
      <Link href="/admin/analytics/overview" className="hover:text-slate-900">Analytics</Link>
      {current && (
        <>
          <span className="mx-2">/</span>
          <span className="font-medium text-slate-900">{label}</span>
        </>
      )}
    </nav>
  );
}
