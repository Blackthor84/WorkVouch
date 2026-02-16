"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Overview = {
  realTimeVisitors: number;
  last24h: {
    totalViews: number;
    uniqueSessions: number;
    sandboxViews: number;
    productionViews: number;
  };
  pagePerformance: { path: string; views: number; uniqueSessions: number }[];
  visitorMap: { country: string; count: number }[];
};

type ErrorsData = {
  windowHours: number;
  totalErrorEvents: number;
  totalPageViews: number;
  errorRate: number;
  byEventName: { name: string; count: number }[];
};

type FunnelStep = { name: string; entered: number; converted: number; dropOff: number };
type FunnelsData = { windowHours: number; steps: FunnelStep[]; filters: { country: string | null; device: string | null; env: string | null } };

type AbuseData = { windowHours: number; signals: { signal_type: string; severity: number; is_sandbox: boolean; created_at: string }[]; bySignalType: { type: string; count: number }[] };

/** Single source of truth for analytics tab IDs. Use this type and activeTab only—no raw "tab" or magic strings. */
type AnalyticsTab =
  | "overview"
  | "realtime"
  | "geography"
  | "funnels"
  | "heatmaps"
  | "journeys"
  | "abuse"
  | "sandbox";

type JourneyItem = { type: "page_view"; at: string; path: string; referrer?: string } | { type: "event"; at: string; event_type: string; metadata?: unknown };

type HeatmapRow = {
  country: string;
  state: string | null;
  count: number;
};

function JourneysSearch() {
  const [sessionId, setSessionId] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ session: { country: string | null; device_type: string | null; is_sandbox: boolean } | null; timeline: JourneyItem[]; error?: string } | null>(null);
  const search = () => {
    const sid = sessionId.trim();
    const uid = userId.trim();
    if (!sid && !uid) return;
    setLoading(true);
    setResult(null);
    const params = new URLSearchParams();
    if (sid) params.set("session_id", sid);
    if (uid) params.set("user_id", uid);
    fetch(`/api/admin/analytics/journeys?${params}`)
      .then((r) => r.json())
      .then((d) => setResult({ session: d.session, timeline: d.timeline ?? [], error: d.error }))
      .catch(() => setResult({ session: null, timeline: [], error: "Request failed" }))
      .finally(() => setLoading(false));
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Session ID (UUID)"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm w-64"
        />
        <span className="text-slate-400">or</span>
        <input
          type="text"
          placeholder="User ID (UUID)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm w-64"
        />
        <Button type="button" size="sm" onClick={search} disabled={loading || (!sessionId.trim() && !userId.trim())}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>
      {result && (
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          {result.error && <p className="text-amber-700 mb-2">{result.error}</p>}
          {result.session && (
            <p className="mb-2 text-slate-600">
              Session: {result.session.country ?? "—"} | {result.session.device_type ?? "—"} | {result.session.is_sandbox ? "Sandbox" : "Prod"}
            </p>
          )}
          <p className="font-medium text-slate-700 mb-1">Timeline ({result.timeline.length} items)</p>
          <ul className="max-h-80 overflow-auto space-y-1 font-mono text-xs">
            {result.timeline.length === 0 ? (
              <li className="text-slate-500">No events</li>
            ) : (
              result.timeline.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-slate-500 shrink-0">{new Date(item.at).toISOString()}</span>
                  {item.type === "page_view" ? (
                    <span>Page: {item.path}</span>
                  ) : (
                    <span>Event: {item.event_type}</span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

const TAB_TO_SEGMENT: Record<AnalyticsTab, string> = {
  overview: "overview",
  realtime: "real-time",
  geography: "geography",
  funnels: "funnels",
  heatmaps: "heatmaps",
  journeys: "journeys",
  abuse: "abuse",
  sandbox: "sandbox",
};

function pathToTab(pathname: string | null): AnalyticsTab {
  if (!pathname) return "overview";
  const segment = pathname.replace(/^\/admin\/analytics\/?/, "").split("/")[0];
  const map: Record<string, AnalyticsTab> = {
    overview: "overview",
    "real-time": "realtime",
    geography: "geography",
    funnels: "funnels",
    heatmaps: "heatmaps",
    journeys: "journeys",
    abuse: "abuse",
    sandbox: "sandbox",
  };
  return map[segment] ?? "overview";
}

type DashboardProps = { initialTab?: AnalyticsTab; forceSandbox?: boolean };

export function AdminAnalyticsDashboard({ initialTab = "overview", forceSandbox = false }: DashboardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const tabFromUrl = pathToTab(pathname);
  const [internalTab, setInternalTab] = useState<AnalyticsTab>(initialTab);
  /** Single source of truth: the tab currently shown. URL-driven unless forceSandbox. */
  const activeTab: AnalyticsTab = forceSandbox ? internalTab : tabFromUrl;

  const [env, setEnv] = useState<"" | "sandbox" | "production">(forceSandbox ? "sandbox" : "");
  const [data, setData] = useState<Overview | null>(null);
  const [errorsData, setErrorsData] = useState<ErrorsData | null>(null);
  const [funnelsData, setFunnelsData] = useState<FunnelsData | null>(null);
  const [abuseData, setAbuseData] = useState<AbuseData | null>(null);
  const [realtime, setRealtime] = useState<{ activeVisitors: number; sandboxActive: number; productionActive: number; recentPageViews: { path: string; is_sandbox: boolean; at: string }[] } | null>(null);
  const [heatmapData, setHeatmapData] = useState<{ data: HeatmapRow[]; message?: string } | null>(null);
  const [platformHealth, setPlatformHealth] = useState<Record<string, unknown> | null>(null);
  const [roleView, setRoleView] = useState<"admin" | "sales" | "marketing" | "ops" | "support" | "finance">("admin");
  const [allowedViews, setAllowedViews] = useState<string[]>(["admin"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const fetchOverview = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (env) params.set("env", env);
    fetch(`/api/admin/analytics/overview?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const fetchErrors = () => {
    const params = new URLSearchParams({ hours: "24" });
    if (env) params.set("env", env);
    fetch(`/api/admin/analytics/errors?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setErrorsData(d))
      .catch(() => {});
  };

  const fetchFunnels = () => {
    const params = new URLSearchParams({ hours: "24" });
    if (env) params.set("env", env);
    fetch(`/api/admin/analytics/funnels?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setFunnelsData(d))
      .catch(() => {});
  };

  const fetchAbuse = () => {
    const params = new URLSearchParams({ hours: "24" });
    if (env) params.set("env", env);
    fetch(`/api/admin/analytics/abuse?${params}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setAbuseData(d))
      .catch(() => {});
  };

  // Data fetching: overview when env changes; errors after overview load; funnels/abuse when tab + env.
  useEffect(() => {
    fetchOverview();
  }, [env]);

  useEffect(() => {
    if (activeTab !== "overview") return;
    const params = new URLSearchParams({ view: roleView });
    fetch(`/api/admin/analytics?${params}`, { credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((d) => {
        if (d) {
          setPlatformHealth(d);
          if (Array.isArray(d.allowedViews)) setAllowedViews(d.allowedViews);
          if (d.view) setRoleView(d.view as "admin" | "sales" | "marketing" | "ops");
        } else setPlatformHealth(null);
      })
      .catch(() => setPlatformHealth(null));
  }, [activeTab, roleView]);

  useEffect(() => {
    if (!data) return;
    fetchErrors();
  }, [data, env]);

  useEffect(() => {
    if (activeTab === "funnels") fetchFunnels();
    if (activeTab === "abuse") fetchAbuse();
  }, [activeTab, env]);

  useEffect(() => {
    if (activeTab !== "geography") return;
    fetch("/api/analytics/heatmap?state=true")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setHeatmapData({ data: d.data ?? [], message: d.message }))
      .catch(() => setHeatmapData({ data: [] }));
  }, [activeTab]);

  // SSE: only open when realtime tab is active; always close on tab change or unmount to avoid leaks.
  useEffect(() => {
    if (activeTab !== "realtime") {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      return;
    }
    const params = new URLSearchParams();
    if (env) params.set("env", env);
    const es = new EventSource(`/api/admin/analytics/stream?${params}`);
    sseRef.current = es;
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data) as { error?: string; activeVisitors?: number; sandboxActive?: number; productionActive?: number; recentPageViews?: { path: string; is_sandbox: boolean; at: string }[] };
        if (d.error) return;
        setRealtime({
          activeVisitors: d.activeVisitors ?? 0,
          sandboxActive: d.sandboxActive ?? 0,
          productionActive: d.productionActive ?? 0,
          recentPageViews: d.recentPageViews ?? [],
        });
      } catch (_) {}
    };
    es.onerror = () => { es.close(); };
    return () => { es.close(); sseRef.current = null; };
  }, [activeTab, env]);

  const tabs: { id: AnalyticsTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "realtime", label: "Real-Time" },
    { id: "geography", label: "Geography" },
    { id: "funnels", label: "Funnels" },
    { id: "heatmaps", label: "Heatmaps" },
    { id: "journeys", label: "User Journeys" },
    { id: "abuse", label: "Abuse & Security" },
  ];

  const goToTab = (id: AnalyticsTab) => {
    if (forceSandbox) setInternalTab(id);
    else router.push(`/admin/analytics/${TAB_TO_SEGMENT[id]}`);
  };

  if (loading && !data) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Failed to load analytics</p>
        <p className="text-sm">{error}</p>
        <Button variant="secondary" size="sm" className="mt-2" onClick={fetchOverview}>Retry</Button>
      </div>
    );
  }

  const o = data!;

  return (
    <div className="space-y-6">
      {!forceSandbox && (
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Environment:</span>
          <div className="flex gap-2">
            {(["", "sandbox", "production"] as const).map((e) => (
              <Button
                key={e || "all"}
                variant={env === e ? "primary" : "secondary"}
                size="sm"
                onClick={() => setEnv(e)}
              >
                {e === "" ? "All" : e === "sandbox" ? "Sandbox" : "Production"}
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={fetchOverview}>Refresh</Button>
        </div>
      )}
      {forceSandbox && (
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <span>Environment: Sandbox only</span>
          <Button variant="ghost" size="sm" onClick={fetchOverview}>Refresh</Button>
        </div>
      )}

      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap gap-2" aria-label="Analytics views">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => goToTab(id)}
              className={`border-b-2 py-2 px-1 text-sm font-medium ${activeTab === id ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              aria-current={activeTab === id ? "page" : undefined}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Role-based metrics</h2>
            <div className="mb-3 border-b border-slate-200">
              <nav className="flex gap-2" aria-label="Analytics view by role">
                {(["admin", "sales", "marketing", "ops", "support", "finance"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setRoleView(v)}
                    disabled={!allowedViews.includes(v)}
                    className={`border-b-2 py-1.5 px-2 text-sm font-medium ${roleView === v ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-600 hover:text-slate-900"} disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-current={roleView === v ? "true" : undefined}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
            {platformHealth != null ? (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {Object.entries(platformHealth)
                  .filter(([k]) => k !== "view" && k !== "allowedViews")
                  .map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-slate-500">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</p>
                      <p className="text-xl font-semibold text-slate-900">{typeof value === "number" ? value : String(value ?? "—")}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Loading…</p>
            )}
            <p className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-3">
              All analytics are shown in aggregate to protect user privacy.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Real-time (5 min)</p>
              <p className="text-2xl font-bold text-slate-900">{o.realTimeVisitors}</p>
              <p className="text-xs text-slate-400">unique sessions</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Last 24h views</p>
              <p className="text-2xl font-bold text-slate-900">{o.last24h.totalViews}</p>
              <p className="text-xs text-slate-400">{o.last24h.uniqueSessions} unique sessions</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Sandbox (24h)</p>
              <p className="text-2xl font-bold text-amber-700">{o.last24h.sandboxViews}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Production (24h)</p>
              <p className="text-2xl font-bold text-emerald-700">{o.last24h.productionViews}</p>
            </div>
          </div>
          {errorsData != null && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Error rates (24h)</h2>
              <div className="grid gap-4 sm:grid-cols-3 text-sm">
                <div><p className="text-slate-500">Error events</p><p className="text-xl font-bold">{errorsData.totalErrorEvents}</p></div>
                <div><p className="text-slate-500">Page views</p><p className="text-xl font-bold">{errorsData.totalPageViews}</p></div>
                <div><p className="text-slate-500">Error rate</p><p className="text-xl font-bold">{errorsData.errorRate.toFixed(2)}%</p></div>
              </div>
              {errorsData.byEventName.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {errorsData.byEventName.map(({ name, count }) => (
                    <li key={name} className="flex justify-between"><span className="font-mono">{name}</span><span className="text-slate-500">{count}</span></li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Page performance (top 50)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="pb-2 pr-4">Path</th><th className="pb-2 pr-4 text-right">Views</th><th className="pb-2 text-right">Unique sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {o.pagePerformance.length === 0 ? (
                    <tr><td colSpan={3} className="py-4 text-slate-500">No visits in window</td></tr>
                  ) : (
                    o.pagePerformance.map(({ path, views, uniqueSessions }) => (
                      <tr key={path} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-mono text-slate-800">{path}</td>
                        <td className="py-2 pr-4 text-right">{views}</td>
                        <td className="py-2 text-right">{uniqueSessions}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "realtime" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Live (SSE)</h2>
          {realtime ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3 text-sm">
                <div><p className="text-slate-500">Active now</p><p className="text-2xl font-bold">{realtime.activeVisitors}</p></div>
                <div><p className="text-slate-500">Sandbox</p><p className="text-2xl font-bold text-amber-700">{realtime.sandboxActive}</p></div>
                <div><p className="text-slate-500">Production</p><p className="text-2xl font-bold text-emerald-700">{realtime.productionActive}</p></div>
              </div>
              <p className="mt-2 text-xs text-slate-400">Recent page views</p>
              <ul className="mt-1 max-h-48 overflow-auto text-sm">
                {realtime.recentPageViews.length === 0 ? <li className="text-slate-500">None</li> : realtime.recentPageViews.map((r, i) => (
                  <li key={i} className="flex justify-between"><span className="font-mono">{r.path}</span><span className={r.is_sandbox ? "text-amber-600" : "text-slate-500"}>{r.is_sandbox ? "sandbox" : "prod"}</span></li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-slate-500">Connecting to stream…</p>
          )}
        </div>
      )}

      {activeTab === "geography" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Visitor map (last 24h, by country)</h2>
            {o.visitorMap.length === 0 ? (
              <p className="text-sm text-slate-500">No geo data in window</p>
            ) : (
              <ul className="space-y-1 text-sm max-h-64 overflow-auto">
                {o.visitorMap.map(({ country, count }) => (
                  <li key={country} className="flex justify-between">
                    <span className="font-medium">{country === "unknown" ? "(unknown)" : country}</span>
                    <span className="text-slate-500">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Adoption (aggregate, country + U.S. state)</h2>
            {heatmapData === null ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : heatmapData.data.length === 0 ? (
              <p className="text-sm text-slate-500">No aggregate data or counts below threshold</p>
            ) : (
              <ul className="space-y-1 text-sm max-h-64 overflow-auto">
                {heatmapData.data.map((row, i) => (
                  <li key={`${row.country}-${row.state ?? ""}-${i}`} className="flex justify-between">
                    <span className="font-medium">
                      {row.country === "unknown" ? "(unknown)" : row.country}
                      {row.state ? ` — ${row.state}` : ""}
                    </span>
                    <span className="text-slate-500">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-500 border-t border-slate-100 pt-3 mt-3">
              Locations are approximate and shown in aggregate to protect user privacy.
            </p>
          </div>
        </div>
      )}

      {activeTab === "funnels" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Funnels (Landing → Signup → Dashboard)</h2>
          {funnelsData ? (
            <div className="space-y-3">
              {funnelsData.steps.map((s, i) => (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <span className="w-24 font-medium">{s.name}</span>
                  <span>Entered: {s.entered}</span>
                  <span>Converted: {s.converted}</span>
                  <span className="text-slate-500">Drop-off: {s.dropOff.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">Loading…</p>
          )}
        </div>
      )}

      {activeTab === "heatmaps" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Heatmaps</h2>
          <p className="text-sm text-slate-600">Send <code className="bg-slate-100 px-1">click</code> or <code className="bg-slate-100 px-1">scroll_depth</code> events via POST /api/analytics/event with event_metadata (path, x_bucket, y_bucket or depth_pct). No PII. Sampling allowed.</p>
          <p className="mt-2 text-xs text-slate-400">Use the Heatmaps API with ?path= and ?kind=click|scroll_depth to view aggregated data.</p>
        </div>
      )}

      {activeTab === "journeys" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">User Journeys</h2>
          <p className="text-sm text-slate-600 mb-3">Search by session ID or user ID to inspect page views and events. No PII.</p>
          <JourneysSearch />
        </div>
      )}

      {activeTab === "abuse" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Abuse & security signals</h2>
          {abuseData ? (
            <>
              <div className="mb-3 flex gap-2 text-sm">
                {abuseData.bySignalType.map(({ type, count }) => (
                  <span key={type} className="rounded bg-slate-100 px-2 py-1">{type}: {count}</span>
                ))}
              </div>
              <ul className="max-h-80 overflow-auto text-sm space-y-1">
                {abuseData.signals.length === 0 ? <li className="text-slate-500">No signals in window</li> : abuseData.signals.map((s, i) => (
                  <li key={i} className="flex justify-between">
                    <span><span className="font-mono">{s.signal_type}</span> severity {s.severity}</span>
                    <span className={s.is_sandbox ? "text-amber-600" : "text-slate-500"}>{s.is_sandbox ? "sandbox" : "prod"}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-slate-500">Loading…</p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Internal analytics only. IPs hashed; no PII. Admin access is audited. Sandbox traffic is isolated.
      </p>
    </div>
  );
}
