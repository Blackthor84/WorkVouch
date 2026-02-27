"use client";

import { useMemo, useState } from "react";
import type { Universe } from "@/lib/trust/multiverse";

type Props = {
  universes: Universe[];
  activeUniverseId: string | null;
  onSelectUniverse: (id: string) => void;
  onScrubTimeline?: (universeId: string, stepIndex: number) => void;
  history: unknown[];
  /** When true, show distortion (e.g. fraud/override). */
  hasDistortion?: boolean;
};

export function MultiverseGraph({
  universes,
  activeUniverseId,
  onSelectUniverse,
  onScrubTimeline,
  history,
  hasDistortion = false,
}: Props) {
  const [scrubIndex, setScrubIndex] = useState(0);

  const { nodes, edges, instability, divergence } = useMemo(() => {
    const nodes = universes.map((u, i) => ({
      id: u.id,
      name: u.name,
      x: 80 + (i % 3) * 140,
      y: 60 + Math.floor(i / 3) * 80,
      signalCount: (u.timeline[u.timeline.length - 1] as { addedReviews?: unknown[] })?.addedReviews?.length ?? 0,
      isActive: u.id === activeUniverseId,
    }));
    const edges = universes
      .filter((u) => u.parentId)
      .map((u) => ({
        from: u.parentId!,
        to: u.id,
      }));
    const instability = hasDistortion ? 1 : 0;
    const divergence = universes.length > 1 ? Math.min(0.8, universes.length * 0.2) : 0;
    return { nodes, edges, instability, divergence };
  }, [universes, activeUniverseId, hasDistortion]);

  const maxSteps = Math.max(1, ...universes.map((u) => u.timeline.length));
  const scrubValue = onScrubTimeline
    ? Math.min(scrubIndex, maxSteps - 1)
    : maxSteps - 1;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Multiverse — Signal influence & divergence</h2>
      <div className="flex gap-4 items-start flex-wrap">
        <div className="relative">
          <svg
            width={420}
            height={220}
            className="block border border-slate-100 rounded"
            style={{
              filter: hasDistortion ? "hue-rotate(10deg) saturate(1.2)" : undefined,
              transition: "filter 0.3s ease",
            }}
          >
            {edges.map((e, i) => {
              const from = nodes.find((n) => n.id === e.from);
              const to = nodes.find((n) => n.id === e.to);
              if (!from || !to) return null;
              return (
                <line
                  key={i}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                />
              );
            })}
            {nodes.map((n) => (
              <g key={n.id}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.isActive ? 18 : 14}
                  fill={n.isActive ? "#2563eb" : "#e2e8f0"}
                  stroke={hasDistortion ? "#dc2626" : (n.isActive ? "#1d4ed8" : "#cbd5e1")}
                  strokeWidth={hasDistortion ? 2 : 1}
                  style={{ cursor: "pointer", transition: "all 0.2s" }}
                  onClick={() => onSelectUniverse(n.id)}
                />
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#475569"
                >
                  {n.name.length > 12 ? n.name.slice(0, 10) + "…" : n.name}
                </text>
                <text
                  x={n.x}
                  y={n.y + 16}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#64748b"
                >
                  {n.signalCount} sig
                </text>
              </g>
            ))}
          </svg>
          {hasDistortion && (
            <div
              className="absolute inset-0 rounded pointer-events-none border-2 border-red-400/50 bg-red-400/5 animate-pulse"
              style={{ animationDuration: "1.5s" }}
            />
          )}
        </div>
        <div className="flex-1 min-w-[200px] space-y-2">
          <div className="text-xs text-slate-600">
            <span className="font-medium">Instability:</span> {instability > 0 ? "High (override/fraud)" : "Low"}
          </div>
          <div className="text-xs text-slate-600">
            <span className="font-medium">Divergence:</span> {(divergence * 100).toFixed(0)}%
          </div>
          {onScrubTimeline && activeUniverseId && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Timeline scrub</label>
              <input
                type="range"
                min={0}
                max={maxSteps - 1}
                value={scrubValue}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setScrubIndex(v);
                  onScrubTimeline(activeUniverseId, v);
                }}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">Step {scrubValue + 1} of {maxSteps}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
