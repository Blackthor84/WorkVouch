"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

type FuzzRun = {
  id: string;
  scenario_id: string;
  scenario_name: string;
  attack_type: string;
  mode: string;
  sandbox_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  step_count: number | null;
  result_summary: Record<string, unknown> | null;
  invariant_results: unknown[] | null;
};

type SnapshotRow = {
  step_index: number;
  step_id: string;
  actor_ref: string;
  actor_id: string;
  profile_strength: number | null;
};

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea", "#0891b2"];

function buildChartData(snapshots: SnapshotRow[]) {
  const byStep = new Map<number, { step_index: number; step_id: string; [actor: string]: number | string }>();
  for (const row of snapshots) {
    if (!byStep.has(row.step_index)) {
      byStep.set(row.step_index, { step_index: row.step_index, step_id: row.step_id });
    }
    const rec = byStep.get(row.step_index)!;
    (rec as Record<string, unknown>)[row.actor_ref] =
      row.profile_strength != null ? row.profile_strength : null;
  }
  return Array.from(byStep.values()).sort((a, b) => a.step_index - b.step_index);
}

function getAbuseStepIndices(
  data: { step_index: number; step_id: string }[],
  abuseEvents: { step_id?: string }[]
): number[] {
  const stepIds = new Set(abuseEvents.map((e) => e.step_id).filter(Boolean));
  return data.filter((d) => stepIds.has(d.step_id)).map((d) => d.step_index);
}

export function TrustCurveVisualizer({
  sandboxId,
}: {
  sandboxId?: string;
}) {
  const [runs, setRuns] = useState<FuzzRun[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [runDetail, setRunDetail] = useState<(FuzzRun & { snapshots?: SnapshotRow[] }) | null>(null);
  const [events, setEvents] = useState<{ abuse: { step_id?: string }[]; rate_limit: { step_id?: string }[] }>({
    abuse: [],
    rate_limit: [],
  });
  const [loading, setLoading] = useState<string>("");
  const [replayStep, setReplayStep] = useState<string>("");
  const [replayResult, setReplayResult] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    setLoading("runs");
    try {
      const url = sandboxId
        ? `/api/sandbox/fuzzer/runs?sandbox_id=${encodeURIComponent(sandboxId)}`
        : "/api/sandbox/fuzzer/runs";
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json().catch(() => []);
      setRuns(Array.isArray(data) ? data : []);
      if (!selectedId && Array.isArray(data) && data.length > 0) {
        setSelectedId((data[0] as FuzzRun).id);
      }
    } finally {
      setLoading(null);
    }
  }, [sandboxId]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  useEffect(() => {
    if (!selectedId) {
      setRunDetail(null);
      setEvents({ abuse: [], rate_limit: [] });
      return;
    }
    setLoading("detail");
    Promise.all([
      fetch(`/api/sandbox/fuzzer/runs/${selectedId}`, { credentials: "include" }).then((r) =>
        r.json()
      ),
      fetch(`/api/sandbox/fuzzer/runs/${selectedId}/events`, { credentials: "include" }).then(
        (r) => r.json()
      ),
    ])
      .then(([runData, eventsData]) => {
        setRunDetail(runData);
        setEvents(
          eventsData?.abuse != null
            ? { abuse: eventsData.abuse, rate_limit: eventsData.rate_limit ?? [] }
            : { abuse: [], rate_limit: [] }
        );
      })
      .catch(() => {
        setRunDetail(null);
        setEvents({ abuse: [], rate_limit: [] });
      })
      .finally(() => setLoading(null));
  }, [selectedId]);

  const handleReplay = async () => {
    const step = parseInt(replayStep, 10);
    if (!selectedId || isNaN(step) || step < 0) return;
    setReplayResult(null);
    try {
      const res = await fetch(`/api/sandbox/fuzzer/runs/${selectedId}/replay`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_step_index: step }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setReplayResult(
          (data as { passed?: boolean }).passed
            ? "Replay completed successfully."
            : `Replay finished: ${(data as { error?: string }).error ?? "check steps"}`
        );
      } else {
        setReplayResult((data as { error?: string }).error ?? "Replay failed");
      }
    } catch {
      setReplayResult("Replay request failed");
    }
  };

  const snapshots = runDetail?.snapshots ?? [];
  const chartData = buildChartData(snapshots);
  const actorRefs = [...new Set(snapshots.map((s) => s.actor_ref))].filter(
    (r) => r !== "admin"
  );
  const abuseStepIndices = getAbuseStepIndices(
    chartData.map((d) => ({ step_index: d.step_index, step_id: d.step_id })),
    events.abuse
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Trust Curve Visualizer</h2>
      <p className="text-sm text-slate-600 mb-4">
        Time-series of trust/reputation per actor. Overlays abuse and rate-limit events. Replay from any step.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm font-medium text-slate-700">Run</label>
        <button
          type="button"
          onClick={() => fetchRuns()}
          disabled={loading === "runs"}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
        >
          Refresh
        </button>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          disabled={loading === "runs"}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 min-w-[200px]"
        >
          <option value="">Select a run</option>
          {runs.map((r) => (
            <option key={r.id} value={r.id}>
              {r.scenario_name} ({r.attack_type}) — {r.status}
            </option>
          ))}
        </select>
        {sandboxId && (
          <span className="text-xs text-slate-500">Simulation: {sandboxId.slice(0, 8)}…</span>
        )}
      </div>

      {loading === "detail" && (
        <div className="text-sm text-slate-500 mb-4">Loading run and snapshots…</div>
      )}

      {chartData.length > 0 && actorRefs.length > 0 && (
        <>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="step_index"
                  type="number"
                  allowDuplicatedCategory={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => (value != null ? [value, "Reputation"] : ["—", ""])}
                  labelFormatter={(label) => `Step ${label}`}
                />
                <Legend />
                {actorRefs.map((ref, i) => (
                  <Line
                    key={ref}
                    type="monotone"
                    dataKey={ref}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                    name={ref}
                  />
                ))}
                {abuseStepIndices.map((x) => (
                  <ReferenceLine
                    key={x}
                    x={x}
                    stroke="#dc2626"
                    strokeDasharray="4 2"
                    label={{ value: "Abuse", position: "top", fontSize: 10 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
            {events.abuse.length > 0 && (
              <span>Abuse events: {events.abuse.length} (red dashed lines)</span>
            )}
            {events.rate_limit.length > 0 && (
              <span>Rate-limit events: {events.rate_limit.length}</span>
            )}
          </div>
        </>
      )}

      {selectedId && chartData.length === 0 && !loading && (
        <div className="py-8 text-center text-slate-500 text-sm">
          No snapshot data for this run (e.g. run failed before steps completed).
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Replay from step index</label>
        <input
          type="number"
          min={0}
          value={replayStep}
          onChange={(e) => setReplayStep(e.target.value)}
          placeholder="0"
          className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={handleReplay}
          disabled={!selectedId || loading !== null}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          Replay from step
        </button>
        {replayResult && (
          <span className="text-sm text-slate-600">{replayResult}</span>
        )}
      </div>

      {runDetail?.invariant_results && Array.isArray(runDetail.invariant_results) && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Invariants</h3>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
            {(runDetail.invariant_results as { name?: string; passed?: boolean; message?: string }[]).map(
              (inv, i) => (
                <li key={i}>
                  {inv.name}: {inv.passed ? "✓" : "✗"}
                  {inv.message ? ` — ${inv.message}` : ""}
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
