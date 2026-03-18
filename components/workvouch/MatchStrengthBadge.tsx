"use client";

import { cn } from "@/lib/utils";

/** match_confidence 0–1 → Weak / Medium / Strong */
export function matchStrengthFromConfidence(confidence: number | null | undefined): "weak" | "medium" | "strong" {
  if (confidence == null || confidence <= 0) return "weak";
  if (confidence < 0.5) return "weak";
  if (confidence < 0.8) return "medium";
  return "strong";
}

const styles = {
  weak: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-800",
  strong: "bg-emerald-100 text-emerald-800",
};

export function MatchStrengthBadge({ confidence }: { confidence?: number | null }) {
  const strength = matchStrengthFromConfidence(confidence ?? null);
  const label = strength === "strong" ? "Strong 🔥" : strength === "medium" ? "Medium" : "Weak";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        styles[strength]
      )}
    >
      {label}
    </span>
  );
}
