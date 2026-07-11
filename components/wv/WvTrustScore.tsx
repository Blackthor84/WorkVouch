"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type WvTrustScoreProps = {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { box: "h-16 w-16", text: "text-xl", ring: 28, stroke: 4 },
  md: { box: "h-28 w-28", text: "text-3xl", ring: 48, stroke: 6 },
  lg: { box: "h-40 w-40", text: "text-5xl", ring: 68, stroke: 8 },
};

function scoreColor(score: number) {
  if (score >= 85) return { stroke: "#10b981", text: "text-emerald-400" };
  if (score >= 70) return { stroke: "#3b82f6", text: "text-blue-400" };
  if (score >= 55) return { stroke: "#f59e0b", text: "text-amber-400" };
  return { stroke: "#ef4444", text: "text-red-400" };
}

export function WvTrustScore({
  score,
  size = "md",
  showLabel = true,
  animate = true,
  className,
}: WvTrustScoreProps) {
  const pct = Math.min(100, Math.max(0, Math.round(score)));
  const [display, setDisplay] = useState(animate ? 0 : pct);
  const { box, text, ring, stroke } = sizeMap[size];
  const colors = scoreColor(pct);
  const circumference = 2 * Math.PI * ring;
  const offset = circumference - (display / 100) * circumference;

  useEffect(() => {
    if (!animate) {
      setDisplay(pct);
      return;
    }
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 900, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(pct * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pct, animate]);

  const svgSize = size === "sm" ? 64 : size === "md" ? 112 : 160;
  const center = svgSize / 2;

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)} aria-label={`Trust score ${pct} out of 100`}>
      <div className={cn("relative", box)}>
        <svg width={svgSize} height={svgSize} className="-rotate-90" aria-hidden>
          <circle
            cx={center}
            cy={center}
            r={ring}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={center}
            cy={center}
            r={ring}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold tabular-nums tracking-tight text-wv-foreground", text, colors.text)}>
            {display}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-wv-muted">
          Trust Score
        </span>
      )}
    </div>
  );
}
