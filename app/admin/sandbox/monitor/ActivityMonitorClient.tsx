"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

export type SandboxEvent = {
  id: string;
  type: string;
  message: string;
  actor?: string;
  metadata?: object;
  safe_mode?: boolean;
  created_at: string;
  entity_type?: string | null;
  sandbox_id?: string | null;
  scenario_id?: string | null;
};

const EVENT_TYPE_PILLS = ["All", "Company", "Scenario", "Review", "Reputation", "Abuse", "Impersonation"] as const;
const MODE_PILLS = ["All", "Real", "Safe Mode"] as const;

function stripeColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("company") || t.includes("generate")) return "#3B82F6";
  if (t.includes("scenario")) return "#8B5CF6";
  if (t.includes("review")) return "#14B8A6";
  if (t.includes("reputation")) return "#22C55E";
  if (t.includes("abuse")) return "#F97316";
  if (t.includes("impersonation")) return "#64748B";
  return "#94A3B8";
}

function titleFromType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("company") || t.includes("generate")) return "Company created";
  if (t.includes("scenario")) return "Scenario run";
  if (t.includes("review")) return "Review created";
  if (t.includes("reputation")) return "Reputation updated";
  if (t.includes("abuse")) return "Abuse signal";
  if (t.includes("impersonation_start") || t.includes("impersonation start")) return "Impersonation started";
  if (t.includes("impersonation_end") || t.includes("impersonation end")) return "Impersonation ended";
  return type.replace(/_/g, " ");
}

function formatTimeAgo(created_at: string): string {
  const d = new Date(created_at);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function LiveStatusIndicator({ updatedAt, isPolling }: { updatedAt: number | null; isPolling: boolean }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const label = updatedAt == null ? "—" : now - updatedAt < 3000 ? "Updated just now" : `${Math.floor((now - updatedAt) / 1000)}s ago`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: isPolling ? "#22C55E" : "#94A3B8",
          animation: isPolling ? "pulse 1.5s ease-in-out infinite" : "none",
        }}
      />
      <span style={{ fontSize: 13, color: "#64748B" }}>{label}</span>
    </div>
  );
}

function FilterBar({
  eventType,
  mode,
  onEventType,
  onMode,
}: {
  eventType: string;
  mode: string;
  onEventType: (v: string) => void;
  onMode: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "#64748B", marginRight: 4 }}>Event type:</span>
        {EVENT_TYPE_PILLS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onEventType(p)}
            style={{
              padding: "4px 10px",
              borderRadius: 9999,
              border: "1px solid #E2E8F0",
              background: eventType === p ? "#E0F2FE" : "#fff",
              color: eventType === p ? "#0369A1" : "#475569",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "#64748B", marginRight: 4 }}>Mode:</span>
        {MODE_PILLS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onMode(p)}
            style={{
              padding: "4px 10px",
              borderRadius: 9999,
              border: "1px solid #E2E8F0",
              background: mode === p ? "#E0F2FE" : "#fff",
              color: mode === p ? "#0369A1" : "#475569",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActivityEventCard({
  event,
  isNew,
}: {
  event: SandboxEvent;
  isNew: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const color = stripeColor(event.type);
  const title = titleFromType(event.type);

  return (
    <article
      style={{
        display: "flex",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid #E2E8F0",
        background: isNew ? "#F0FDF4" : "#fff",
        transition: "background 0.4s ease",
      }}
    >
      <div style={{ width: 4, minHeight: "100%", background: color }} />
      <div style={{ flex: 1, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <strong style={{ fontSize: 14 }}>{title}</strong>
            {event.safe_mode && (
              <span
                title="This action was simulated due to missing sandbox data."
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "#FEF3C7",
                  color: "#92400E",
                }}
              >
                🧪 Simulated
              </span>
            )}
          </div>
          <time style={{ fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>
            {formatTimeAgo(event.created_at)}
          </time>
        </div>
        <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#475569", lineHeight: 1.4 }}>
          {event.message}
        </p>
        {(event.actor || event.entity_type || event.sandbox_id) && (
          <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#64748B" }}>
            {event.actor && <span>Actor: {event.actor}</span>}
            {(event.metadata as { actor_display?: string } | undefined)?.actor_display?.includes("impersonated") && (
              <span style={{ marginLeft: 6, background: "#FEF3C7", color: "#92400E", padding: "1px 6px", borderRadius: 4 }}>Impersonated</span>
            )}
            {event.entity_type && <span style={{ marginLeft: 8 }}>Entity: {event.entity_type}</span>}
            {event.sandbox_id && (
              <span style={{ marginLeft: 8 }}>
                Simulation: <code style={{ fontSize: 10 }}>{event.sandbox_id.slice(0, 8)}…</code>
              </span>
            )}
          </p>
        )}
        {(event.metadata && Object.keys(event.metadata).length > 0) && (
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setDetailsOpen((o) => !o)}
              style={{
                fontSize: 12,
                color: "#64748B",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
              }}
            >
              {detailsOpen ? "Hide details" : "View details"}
            </button>
            {detailsOpen && (
              <>
                {(event.metadata as { targetUserId?: string } | undefined)?.targetUserId && (
                  <p style={{ marginTop: 6, fontSize: 12 }}>
                    <Link
                      href={`/admin/users/${(event.metadata as { targetUserId: string }).targetUserId}`}
                      style={{ color: "#2563EB" }}
                    >
                      View user →
                    </Link>
                  </p>
                )}
                <pre
                  style={{
                    marginTop: 6,
                    padding: 10,
                    background: "#F8FAFC",
                    borderRadius: 6,
                    fontSize: 11,
                    overflow: "auto",
                    maxHeight: 200,
                  }}
                >
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ActivityFeed({
  events,
  eventTypeFilter,
  modeFilter,
  seenIds,
}: {
  events: SandboxEvent[];
  eventTypeFilter: string;
  modeFilter: string;
  seenIds: Set<string>;
}) {
  const filtered = useMemo(() => {
    let list = events;
    if (eventTypeFilter !== "All") {
      const map: Record<string, (e: SandboxEvent) => boolean> = {
        Company: (e) => /company|generate/i.test(e.type),
        Scenario: (e) => /scenario/i.test(e.type),
        Review: (e) => /review/i.test(e.type),
        Reputation: (e) => /reputation/i.test(e.type),
        Abuse: (e) => /abuse/i.test(e.type),
        Impersonation: (e) => /impersonation/i.test(e.type),
      };
      const fn = map[eventTypeFilter];
      if (fn) list = list.filter(fn);
    }
    if (modeFilter === "Real") list = list.filter((e) => e.safe_mode !== true);
    if (modeFilter === "Safe Mode") list = list.filter((e) => e.safe_mode === true);
    return list;
  }, [events, eventTypeFilter, modeFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {filtered.map((event) => (
        <ActivityEventCard key={event.id} event={event} isNew={!seenIds.has(event.id)} />
      ))}
    </div>
  );
}

function MonitorImpersonationBanner({ events }: { events: SandboxEvent[] }) {
  const started = events.some((e) => /impersonation.*start|impersonation_started/i.test(e.type));
  const ended = events.some((e) => /impersonation.*end|impersonation_ended/i.test(e.type));
  const lastStart = events.find((e) => /impersonation.*start|impersonation_started/i.test(e.type));
  const meta = lastStart?.metadata as { targetName?: string } | undefined;
  const name = meta?.targetName ?? lastStart?.actor ?? lastStart?.message?.replace(/.*impersonat(?:ing)?\s+/i, "") ?? "Sandbox user";
  if (!started || ended) return null;
  return (
    <div
      style={{
        padding: "12px 16px",
        background: "#E0F2FE",
        border: "1px solid #0EA5E9",
        borderRadius: 8,
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span style={{ color: "#0369A1", fontWeight: 600 }}>🎭 You are impersonating {name}</span>
      <Link
        href="/admin/playground"
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid #0EA5E9",
          background: "#fff",
          color: "#0369A1",
          fontSize: 13,
          textDecoration: "none",
        }}
      >
        Exit Impersonation
      </Link>
    </div>
  );
}

function rowToEvent(r: Record<string, unknown>): SandboxEvent {
  return {
    id: String(r.id ?? ""),
    type: String(r.type ?? ""),
    message: String(r.message ?? ""),
    actor: r.actor != null ? String(r.actor) : undefined,
    metadata: (r.metadata as object) ?? undefined,
    safe_mode: (r.metadata as { safe_mode?: boolean } | undefined)?.safe_mode,
    created_at: String(r.created_at ?? ""),
    entity_type: r.entity_type != null ? String(r.entity_type) : undefined,
    sandbox_id: r.sandbox_id != null ? String(r.sandbox_id) : undefined,
    scenario_id: r.scenario_id != null ? String(r.scenario_id) : undefined,
  };
}

export function ActivityMonitorPage() {
  const [events, setEvents] = useState<SandboxEvent[]>([]);
  const [eventType, setEventType] = useState("All");
  const [mode, setMode] = useState("All");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [pollError, setPollError] = useState(false);
  const previousIdsRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);

  const [filterSimulationId, setFilterSimulationId] = useState("");
  const [filterScenarioId, setFilterScenarioId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterActor, setFilterActor] = useState("");

  const fetchEvents = useCallback(async () => {
    try {
      const sp = new URLSearchParams();
      if (filterSimulationId.trim()) sp.set("sandbox_id", filterSimulationId.trim());
      if (filterScenarioId.trim()) sp.set("scenario_id", filterScenarioId.trim());
      if (filterType.trim()) sp.set("type", filterType.trim());
      if (filterActor.trim()) sp.set("actor", filterActor.trim());
      const qs = sp.toString();
      const url = qs ? `/api/sandbox/events?${qs}` : "/api/sandbox/events";
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? data : [];
      setEvents(list);
      setUpdatedAt(Date.now());
      setPollError(false);
    } catch {
      setPollError(true);
    }
  }, [filterSimulationId, filterScenarioId, filterType, filterActor]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  useEffect(() => {
    const channel = supabaseBrowser
      .channel("sandbox-events-monitor")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sandbox_events" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          setEvents((prev) => [rowToEvent(row), ...prev]);
          setUpdatedAt(Date.now());
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabaseBrowser.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const seenIds = useMemo(() => {
    const next = new Set(events.map((e) => e.id));
    const prev = previousIdsRef.current;
    previousIdsRef.current = next;
    return prev;
  }, [events]);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>

      <MonitorImpersonationBanner events={events} />

      <header
        style={{
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 10,
          paddingBottom: 16,
          borderBottom: "1px solid #E2E8F0",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Simulation Activity Monitor</h1>
            <p style={{ margin: "4px 0 0 0", color: "#64748B", fontSize: 14 }}>
              Realtime timeline of simulation events (activity_log + system audit). Filter by simulation, scenario, mode, actor.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <LiveStatusIndicator updatedAt={updatedAt} isPolling={!pollError} />
            <Link
              href="/admin/playground"
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                background: "#fff",
                color: "#475569",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Back to Playground
            </Link>
          </div>
        </div>
      </header>

      {pollError && (
        <div
          style={{
            padding: 12,
            background: "#FEF3C7",
            border: "1px solid #F59E0B",
            borderRadius: 8,
            marginBottom: 16,
            color: "#92400E",
          }}
        >
          Live updates paused. Retrying…
        </div>
      )}

      <FilterBar eventType={eventType} mode={mode} onEventType={setEventType} onMode={setMode} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#64748B" }}>Filters:</span>
        <input
          type="text"
          placeholder="Simulation ID"
          value={filterSimulationId}
          onChange={(e) => setFilterSimulationId(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, width: 160 }}
        />
        <input
          type="text"
          placeholder="Scenario"
          value={filterScenarioId}
          onChange={(e) => setFilterScenarioId(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, width: 140 }}
        />
        <input
          type="text"
          placeholder="Event type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, width: 120 }}
        />
        <input
          type="text"
          placeholder="Actor (user id)"
          value={filterActor}
          onChange={(e) => setFilterActor(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, width: 180 }}
        />
      </div>

      {events.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "#64748B",
          }}
        >
          <p style={{ margin: 0, fontSize: 18 }}>No simulation activity yet</p>
          <p style={{ margin: "8px 0 16px 0", fontSize: 14 }}>
            Run a simulation or scenario from Playground to see events here.
          </p>
          <Link
            href="/admin/playground"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: 6,
              border: "1px solid #3B82F6",
              background: "#3B82F6",
              color: "#fff",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Go to Playground
          </Link>
        </div>
      ) : (
        <ActivityFeed
          events={events}
          eventTypeFilter={eventType}
          modeFilter={mode}
          seenIds={seenIds}
        />
      )}
    </div>
  );
}
