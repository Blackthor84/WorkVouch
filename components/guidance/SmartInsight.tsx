"use client";

import {
  insightBand,
  normalizeConfidence,
  riskFromSignals,
  smartInsightMessage,
  type InsightBand,
} from "@/lib/guidance/hiringGuidanceLogic";
import { cn } from "@/lib/utils";

type SmartInsightProps = {
  trustScore: number;
  confidence?: string | number | null;
  referenceCount?: number;
  verifiedCoworkerCount?: number;
  className?: string;
  compact?: boolean;
};

function iconForBand(band: InsightBand) {
  switch (band) {
    case "good":
      return "✅";
    case "medium":
      return "⚠️";
    default:
      return "❌";
  }
}

export function SmartInsight({
  trustScore,
  confidence,
  referenceCount = 0,
  verifiedCoworkerCount = 0,
  className,
  compact,
}: SmartInsightProps) {
  const trust = Math.min(100, Math.max(0, Math.round(trustScore)));
  const confPct = normalizeConfidence(confidence);
  const verifications = Math.max(referenceCount, verifiedCoworkerCount);
  const risk = riskFromSignals(trust, confPct, verifications);
  const band = insightBand(trust, confPct, risk);
  const msg = smartInsightMessage(band);

  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        band === "good" && "border-emerald-200 bg-emerald-50/80",
        band === "medium" && "border-amber-200 bg-amber-50/80",
        band === "risky" && "border-red-200 bg-red-50/80",
        className
      )}
      role="status"
    >
      <p className={cn("text-slate-800 flex gap-2", compact ? "text-xs" : "text-sm")}>
        <span className="shrink-0" aria-hidden>
          {iconForBand(band)}
        </span>
        <span>{msg}</span>
      </p>
    </div>
  );
}
