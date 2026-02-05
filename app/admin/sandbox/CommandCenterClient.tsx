"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IntelligenceSandboxClient } from "@/app/admin/intelligence-sandbox/IntelligenceSandboxClient";
import AdminSimulationSandbox from "@/components/admin/AdminSimulationSandbox";
import { SimulationBuilderDataSection } from "@/components/admin/SimulationBuilderDataSection";

type SandboxRow = { id: string; name: string | null; starts_at: string; ends_at: string; status: string };
type SandboxMetrics = {
  profiles_count: number;
  employers_count: number;
  peer_reviews_count: number;
  hiring_confidence_avg: number | null;
  ad_total_spend: number;
  ad_total_impressions: number;
  ad_total_clicks: number;
  ad_total_conversions: number;
  employers?: { id: string; company_name: string }[];
};

type WorkspaceTab = "simulation" | "intelligence" | null;

const CONTROL_MODULES: { id: string; label: string; href?: string }[] = [
  { id: "launch", label: "Launch Simulation", href: undefined },
  { id: "end", label: "End Simulation", href: undefined },
  { id: "flags", label: "Feature Flag Controls", href: "/admin/hidden-features" },
  { id: "plan", label: "Plan Tier Switch", href: "/admin/preview-control" },
  { id: "role", label: "Role Switch", href: "/admin/preview-control" },
  { id: "recalc", label: "Recalculate", href: undefined },
];

function useSandboxMetrics(sandboxId: string | null) {
  const [metrics, setMetrics] = useState<SandboxMetrics | null>(null);
  const [sandboxes, setSandboxes] = useState<SandboxRow[]>([]);
  const [endsAt, setEndsAt] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/intelligence-sandbox?list=1", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Sandbox list fetch failed", res.status);
        setSandboxes([]);
        return;
      }
      setSandboxes(json.sandboxes ?? []);
    } catch (err) {
      console.error("Sandbox list fetch failed", err);
      setSandboxes([]);
    }
  }, []);

  const fetchMetrics = useCallback(async (id: string) => {
    if (!id) {
      console.log("No active sandbox — skipping metrics fetch");
      return;
    }
    console.log("Fetching sandbox metrics for:", id);
    try {
      const res = await fetch(`/api/admin/intelligence-sandbox?sandboxId=${encodeURIComponent(id)}`, { credentials: "include" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Sandbox metrics fetch failed", res.status);
        setMetrics(null);
        return;
      }
      setMetrics(j.metrics ?? null);
      const sb = j.sandbox;
      if (sb?.ends_at) setEndsAt(sb.ends_at);
    } catch (err) {
      console.error("Sandbox metrics fetch failed", err);
      setMetrics(null);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (sandboxId) fetchMetrics(sandboxId);
    else {
      setMetrics(null);
      setEndsAt(null);
    }
  }, [sandboxId, fetchMetrics]);

  const refetchMetrics = useCallback(() => {
    if (sandboxId) fetchMetrics(sandboxId);
  }, [sandboxId, fetchMetrics]);

  return { metrics, sandboxes, endsAt, refetchList: fetchList, refetchMetrics };
}

function useCountdown(endsAt: string | null) {
  const [left, setLeft] = useState<string>("—");
  useEffect(() => {
    if (!endsAt) {
      setLeft("—");
      return;
    }
    const tick = () => {
      const ms = new Date(endsAt).getTime() - Date.now();
      if (ms <= 0) {
        setLeft("Expired");
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLeft(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return left;
}

export function CommandCenterClient({
  employerList,
  role,
}: {
  employerList: { id: string; company_name?: string }[];
  role: string | null | undefined;
}) {
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>(null);
  const { metrics, sandboxes, endsAt, refetchList, refetchMetrics } = useSandboxMetrics(sandboxId);
  const countdown = useCountdown(endsAt);

  const activeSandbox = useMemo(() => sandboxes.find((s) => s.id === sandboxId) ?? null, [sandboxes, sandboxId]);

  useEffect(() => {
    if (!sandboxId && sandboxes.length > 0) {
      setSandboxId(sandboxes[0].id);
      console.log("Auto-selected sandbox:", sandboxes[0].id);
    }
  }, [sandboxes, sandboxId]);

  const gaugeValues = useMemo(() => {
    if (!metrics) return null;
    const h = metrics.hiring_confidence_avg ?? 0;
    const n = metrics.profiles_count + metrics.peer_reviews_count || 1;
    return {
      profileStrength: n > 0 ? Math.min(100, 40 + (metrics.peer_reviews_count / Math.max(1, metrics.profiles_count)) * 15) : 0,
      careerHealth: h,
      riskIndex: 100 - h,
      teamFit: h * 0.95,
      hiringConfidence: h,
      networkDensity: Math.min(100, (metrics.peer_reviews_count / Math.max(1, metrics.profiles_count)) * 25),
    };
  }, [metrics]);

  const execStats = useMemo(() => {
    if (!metrics) return { profiles: 0, employment: 0, references: 0, density: 0, mrr: 0, adRoi: 0 };
    const roi = metrics.ad_total_spend > 0 && metrics.ad_total_conversions > 0
      ? (metrics.ad_total_conversions * 150) / metrics.ad_total_spend
      : 0;
    return {
      profiles: metrics.profiles_count,
      employment: metrics.profiles_count,
      references: metrics.peer_reviews_count,
      density: metrics.profiles_count + metrics.peer_reviews_count,
      mrr: 0,
      adRoi: roi,
    };
  }, [metrics]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-700 bg-slate-950/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
          <span className="font-mono text-sm font-medium tracking-wider text-[#9ca3af]">
            WORKVOUCH // ENTERPRISE COMMAND
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 font-mono text-xs text-[#6b7280]">
              <span className="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Online
            </span>
            {activeSandbox && (
              <span className="rounded-md border border-[#10b981/30] bg-[#10b981/10] px-2 py-1 font-mono text-[10px] text-[#10b981]">
                {activeSandbox.name || activeSandbox.id.slice(0, 8)}
              </span>
            )}
            {role && (
              <span className="font-mono text-[10px] uppercase text-[#6b7280]">{role}</span>
            )}
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="font-mono text-xs text-[#9ca3af]">
                ← Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Three-column grid */}
      <div className="mx-auto max-w-[1600px] grid grid-cols-1 gap-6 p-4 lg:grid-cols-12">
        {/* Left: 25% */}
        <aside className="space-y-3 lg:col-span-3">
          <p className="font-mono text-sm uppercase tracking-wide text-slate-400">System Controls</p>
          {CONTROL_MODULES.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-700 bg-slate-800 p-6 font-mono text-sm text-emerald-400 shadow-lg transition-shadow hover:shadow-[0_0_20px_rgba(16,185,129,0.06)]"
            >
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                {m.href ? (
                  <Link href={m.href} className="font-mono text-sm md:text-base text-emerald-400 hover:text-green-400">
                    {m.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="relative z-50 cursor-pointer font-mono text-sm md:text-base text-emerald-400 hover:text-green-400"
                    onClick={async () => {
                      if (m.id === "launch") setWorkspaceTab("simulation");
                      if (m.id === "end") setWorkspaceTab(null);
                      if (m.id === "recalc") {
                        if (sandboxId) {
                          try {
                            await fetch("/api/admin/intelligence-sandbox/recalculate", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ sandbox_id: sandboxId }),
                            });
                          } catch {
                            // no-op
                          }
                        }
                        refetchList();
                        refetchMetrics();
                      }
                    }}
                  >
                    {m.label}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-lg">
            <p className="mb-2 font-mono text-sm uppercase tracking-wide text-slate-400">Active Sandbox</p>
            <select
              value={sandboxId ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                setSandboxId(id || null);
                console.log("Active sandbox set:", id);
              }}
              className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 font-mono text-sm text-emerald-400"
            >
              <option value="">None</option>
              {sandboxes.map((s) => (
                <option key={s.id} value={s.id}>{s.name || s.id.slice(0, 8)}</option>
              ))}
            </select>
          </div>
        </aside>

        {/* Center: 50% — Metrics card grid */}
        <main className="space-y-4 lg:col-span-6">
          <p className="font-mono text-sm uppercase tracking-wide text-slate-400">Metrics</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Profile Strength", value: gaugeValues?.profileStrength ?? 0, isIntelligence: true },
              { label: "Career Health", value: gaugeValues?.careerHealth ?? 0, isIntelligence: true },
              { label: "Risk Index", value: gaugeValues?.riskIndex ?? 0, isIntelligence: true },
              { label: "Team Fit", value: gaugeValues?.teamFit ?? 0, isIntelligence: true },
              { label: "Hiring Confidence", value: gaugeValues?.hiringConfidence ?? 0, isIntelligence: true },
              { label: "Network Density", value: gaugeValues?.networkDensity ?? 0, isIntelligence: true },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-lg"
              >
                <p className="text-sm uppercase tracking-wide text-slate-400">{item.label}</p>
                <p
                  className={`mt-2 text-3xl font-bold tabular-nums ${
                    item.isIntelligence ? "text-cyan-400 drop-shadow-md" : "text-white"
                  }`}
                >
                  {typeof item.value === "number"
                    ? item.value % 1 === 0
                      ? String(item.value)
                      : item.value.toFixed(2)
                    : "—"}
                </p>
                {metrics && (
                  <p className="mt-1 font-mono text-xs text-slate-500">live</p>
                )}
              </div>
            ))}
          </div>

          {/* Executive Metrics — separate section */}
          <div className="mt-10 border-t border-slate-700 pt-6">
            <h2 className="text-lg font-semibold text-white">Executive Metrics</h2>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Profiles", value: execStats.profiles },
                { label: "Employment Records", value: execStats.employment },
                { label: "References", value: execStats.references },
                { label: "Data Density", value: execStats.density },
                { label: "MRR (sandbox)", value: execStats.mrr },
                { label: "Ad ROI (sandbox)", value: execStats.adRoi },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-lg"
                >
                  <p className="text-sm uppercase tracking-wide text-slate-400">{s.label}</p>
                  <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                    {typeof s.value === "number"
                      ? s.value % 1 === 0
                        ? String(s.value)
                        : s.value.toFixed(2)
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right: 25% — Command Console */}
        <aside className="space-y-3 lg:col-span-3">
          <p className="font-mono text-sm uppercase tracking-wide text-slate-400">Command Console</p>
          <div
            className="mt-6 max-h-72 overflow-y-auto rounded-xl border border-emerald-500/40 bg-black p-4 font-mono text-sm text-emerald-400 shadow-inner"
          >
            <div className="space-y-2">
              <p className="text-slate-400">&gt; Active sandbox: {activeSandbox ? (activeSandbox.name || activeSandbox.id.slice(0, 8)) : "None"}</p>
              <p className="text-slate-400">&gt; Profiles: <span className="text-white">{execStats.profiles}</span></p>
              <p className="text-slate-400">&gt; Employers: <span className="text-white">{metrics?.employers_count ?? 0}</span></p>
              <p className="text-slate-400">&gt; Employment records: <span className="text-white">{execStats.employment}</span></p>
              <p className="text-slate-400">&gt; References: <span className="text-white">{execStats.references}</span></p>
              <p className="text-green-400">&gt; Session expiry: {countdown}</p>
              {metrics && (
                <p className="text-green-400">&gt; Metrics OK</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Workspace: existing sandbox tabs */}
      <div className="mx-auto max-w-[1600px] border-t border-slate-700 p-4">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setWorkspaceTab(workspaceTab === "simulation" ? null : "simulation")}
            className={`relative z-50 cursor-pointer rounded-xl px-3 py-2 font-mono text-sm transition-colors ${
              workspaceTab === "simulation"
                ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                : "border border-slate-700 text-slate-400 hover:text-emerald-400"
            }`}
          >
            Simulation Builder
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceTab(workspaceTab === "intelligence" ? null : "intelligence")}
            className={`relative z-50 cursor-pointer rounded-xl px-3 py-2 font-mono text-sm transition-colors ${
              workspaceTab === "intelligence"
                ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                : "border border-slate-700 text-slate-400 hover:text-emerald-400"
            }`}
          >
            Intelligence Sandbox
          </button>
        </div>
        {workspaceTab === "simulation" && (
          <div className="mt-6 max-h-72 overflow-y-auto rounded-xl border border-emerald-500/40 bg-black p-4 font-mono text-sm text-emerald-400 shadow-inner">
            <AdminSimulationSandbox />
            <div className="mt-6">
              <p className="mb-3 text-sm uppercase tracking-wide text-slate-400">Data input</p>
              <SimulationBuilderDataSection
                sandboxId={sandboxId}
                employerList={(metrics?.employers && metrics.employers.length > 0) ? metrics.employers : employerList}
                onSuccess={() => { refetchList(); refetchMetrics(); }}
              />
            </div>
          </div>
        )}
        {workspaceTab === "intelligence" && (
          <div className="mt-6 max-h-72 overflow-y-auto rounded-xl border border-emerald-500/40 bg-black p-4 font-mono text-sm text-emerald-400 shadow-inner">
            <IntelligenceSandboxClient
              employerList={employerList}
              onSandboxCreated={(id) => {
                setSandboxId(id);
                console.log("Active sandbox set:", id);
                refetchList();
                refetchMetrics();
              }}
              onSandboxDataChange={async () => {
                await refetchList();
                await refetchMetrics();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
