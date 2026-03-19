"use client";

import { cn } from "@/lib/utils";

export function trustScoreColor(score: number): string {
  if (score > 70) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 40) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export function TrustScoreBadge({
  score,
  size = "md",
  blur,
  className,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  blur?: boolean;
  className?: string;
}) {
  const displayScore = Math.min(100, Math.max(0, Math.round(score)));
  const sizeClass =
    size === "lg" ? "text-3xl font-bold" : size === "md" ? "text-xl font-semibold" : "text-sm font-medium";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl border px-3 py-1 tabular-nums",
        trustScoreColor(displayScore),
        sizeClass,
        blur && "blur-sm select-none",
        className
      )}
    >
      {displayScore}
    </span>
  );
}
