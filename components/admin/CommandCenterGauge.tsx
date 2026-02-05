"use client";

import { useMemo } from "react";

const R = 36;
const STROKE = 6;
const CX = 44;
const CY = 44;
const VIEW = 88;

interface CommandCenterGaugeProps {
  value: number;
  label: string;
  delta?: number | null;
  updatedAt?: string | null;
  max?: number;
}

export function CommandCenterGauge({
  value,
  label,
  delta = null,
  updatedAt = null,
  max = 100,
}: CommandCenterGaugeProps) {
  const clamped = useMemo(() => Math.max(0, Math.min(max, value)), [value, max]);
  const pct = useMemo(() => (max > 0 ? clamped / max : 0), [clamped, max]);
  const circumference = useMemo(() => 2 * Math.PI * R, []);
  const strokeDash = useMemo(() => circumference * pct, [circumference, pct]);

  return (
    <div className="rounded-md border border-[#1a1f2e] bg-[#0f131c] p-4 transition-shadow hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#6b7280]">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[#e5e7eb]">
            {typeof value === "number" && !Number.isNaN(value) ? value.toFixed(1) : "—"}
          </p>
          {delta != null && !Number.isNaN(delta) && (
            <p className={`mt-0.5 font-mono text-xs ${delta >= 0 ? "text-[#10b981]" : "text-[#f59e0b]"}`}>
              {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
            </p>
          )}
          {updatedAt && (
            <p className="mt-1 font-mono text-[10px] text-[#4b5563]">Updated {updatedAt}</p>
          )}
        </div>
        <svg width={VIEW} height={VIEW} className="shrink-0" aria-hidden>
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="#1f2937"
            strokeWidth={STROKE}
          />
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke="#10b981"
            strokeWidth={STROKE}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - strokeDash}
            strokeLinecap="round"
            transform={`rotate(-90 ${CX} ${CY})`}
            className="transition-all duration-500"
          />
        </svg>
      </div>
    </div>
  );
}
