"use client";

import { useEffect, useState } from "react";

/** Privacy-safe: country-level only. No city, state, or coordinates. */
type HeatmapRow = { country: string; count: number };

type HeatMapCountryProps = {
  /** Optional title above the list */
  title?: string;
  /** Max items to show (default 20) */
  maxItems?: number;
  /** Optional class for the container */
  className?: string;
};

/**
 * Public adoption heat map — country-level only.
 * Fetches GET /api/analytics/heatmap (no state param). Shows aggregated counts and mandatory disclaimer.
 * Do not use for city/state/coordinates; no pins or map zoom.
 */
export function HeatMapCountry({ title = "Where we're used", maxItems = 20, className = "" }: HeatMapCountryProps) {
  const [data, setData] = useState<HeatmapRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/heatmap", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData((d?.data ?? []).slice(0, maxItems)))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [maxItems]);

  return (
    <div className={className}>
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-2">{title}</h3>}
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-slate-500">No aggregate data yet</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {data.map(({ country, count }) => (
            <li key={country} className="flex justify-between text-slate-600">
              <span>{country === "unknown" ? "(unknown)" : country}</span>
              <span className="text-slate-400 tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
        Locations are approximate and shown in aggregate to protect user privacy.
      </p>
    </div>
  );
}
