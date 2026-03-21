"use client";

import Link from "next/link";
import {
  insightBand,
  normalizeConfidence,
  riskFromSignals,
  suggestedActions,
} from "@/lib/guidance/hiringGuidanceLogic";
import { cn } from "@/lib/utils";

type SuggestedActionsProps = {
  trustScore: number;
  confidence?: string | number | null;
  referenceCount?: number;
  verifiedCoworkerCount?: number;
  candidateId?: string;
  className?: string;
  compact?: boolean;
};

export function SuggestedActions({
  trustScore,
  confidence,
  referenceCount = 0,
  verifiedCoworkerCount = 0,
  candidateId,
  className,
  compact,
}: SuggestedActionsProps) {
  const trust = Math.min(100, Math.max(0, Math.round(trustScore)));
  const confPct = normalizeConfidence(confidence);
  const verifications = Math.max(referenceCount, verifiedCoworkerCount);
  const risk = riskFromSignals(trust, confPct, verifications);
  const band = insightBand(trust, confPct, risk);
  const actions = suggestedActions({
    band,
    risk,
    trust,
    confidencePct: confPct,
    referenceCount,
    candidateId,
  });

  if (actions.length === 0) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <p
        className={cn(
          "font-medium text-slate-600",
          compact ? "text-[10px] uppercase tracking-wide" : "text-xs"
        )}
      >
        Suggested next steps
      </p>
      <ul className="flex flex-col gap-1.5">
        {actions.map((a) => (
          <li key={a.label}>
            {a.href ? (
              <Link
                href={a.href}
                className={cn(
                  "block rounded-lg border px-3 py-2 text-sm transition-colors",
                  a.primary
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-medium hover:bg-emerald-100"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {a.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "block rounded-lg border px-3 py-2 text-sm",
                  a.primary
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-medium"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                )}
              >
                {a.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
