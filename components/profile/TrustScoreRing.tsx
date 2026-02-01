"use client";

import { cn } from "@/lib/utils";

export interface TrustScoreRingProps {
  score: number;
  maxScore?: number;
  size?: "sm" | "md" | "lg";
  strokeWidth?: number;
  className?: string;
}

const sizeMap = { sm: 48, md: 72, lg: 96 };
const defaultStroke = 4;

export function TrustScoreRing({
  score,
  maxScore = 100,
  size = "md",
  strokeWidth = defaultStroke,
  className,
}: TrustScoreRingProps) {
  const dimension = sizeMap[size];
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(maxScore, Math.max(0, score));
  const progress = clamped / maxScore;
  const strokeDashoffset = circumference * (1 - progress);

  const colorClass =
    score >= 70 ? "stroke-emerald-500" : score >= 40 ? "stroke-amber-500" : "stroke-red-500";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={dimension} height={dimension} className="-rotate-90" aria-hidden>
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn("transition-[stroke-dashoffset] duration-500", colorClass)}
        />
      </svg>
      <span className="absolute text-center font-semibold text-[#1E293B] dark:text-slate-200" style={{ fontSize: size === "lg" ? "1.25rem" : size === "md" ? "1rem" : "0.875rem" }}>
        {Math.round(score)}
      </span>
    </div>
  );
}
