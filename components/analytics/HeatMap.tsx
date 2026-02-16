"use client";

import { useEffect, useState } from "react";

/** Privacy-safe: country + US state only. No city, coordinates, or per-user data. */
export type HeatMapRow = {
  country: string;
  state: string | null;
  count: number;
};

type HeatMapProps = {
  /** If true, fetch with ?state=true for country + state (requires auth). Default false = country-only. */
  includeState?: boolean;
  /** If true, only show country-level rows (state === null). Use for marketing. */
  countryOnly?: boolean;
  /** Optional title above the map area */
  title?: string;
  /** Optional class for the container */
  className?: string;
};

/**
 * Privacy-safe heat map UI. Shows country always; U.S. state only when includeState and authenticated.
 * No city labels, coordinates, pins/dots, or real-time updates. Zoom below state is not allowed.
 */
export default function HeatMap({
  includeState = false,
  countryOnly = false,
  title,
  className = "",
}: HeatMapProps) {
  const [data, setData] = useState<HeatMapRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = includeState ? "/api/analytics/heatmap?state=true" : "/api/analytics/heatmap";
    fetch(url, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        const rows = (d?.data ?? []) as HeatMapRow[];
        setData(countryOnly ? rows.filter((r) => r.state == null) : rows);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [includeState, countryOnly]);

  return (
    <div className={`space-y-2 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-slate-700">{title}</h3>}
      <div className="h-[420px] w-full rounded border border-slate-200 flex items-center justify-center bg-slate-50/50">
        {loading ? (
          <span className="text-sm text-slate-500">Loading…</span>
        ) : data.length === 0 ? (
          <span className="text-sm text-slate-500">No aggregate data yet</span>
        ) : (
          <span className="text-sm text-slate-500">
            Heat map rendered from aggregated country and state data
          </span>
        )}
      </div>
      {!loading && data.length > 0 && (
        <ul className="text-xs text-slate-500 space-y-0.5 max-h-32 overflow-auto">
          {data.slice(0, 15).map((row, i) => (
            <li key={`${row.country}-${row.state ?? ""}-${i}`}>
              {row.country === "unknown" ? "(unknown)" : row.country}
              {row.state ? ` — ${row.state}` : ""}: {row.count}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-500">
        Locations are approximate and shown in aggregate to protect user privacy.
      </p>
    </div>
  );
}
