"use client";

import { useEffect, useState } from "react";

type AnimatedCounterProps = {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

export function AnimatedCounter({
  value,
  duration = 1400,
  decimals = 0,
  suffix = "",
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();

  return (
    <span className={className}>
      {formatted}
      {suffix}
    </span>
  );
}

export function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={i < value ? "text-amber-400" : "text-gray-200"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function SkillBar({
  label,
  score,
  color = "bg-blue-600",
}: {
  label: string;
  score: number;
  color?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="tabular-nums text-gray-900 font-semibold">{score}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreRing({
  score,
  size = 120,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 85 ? "#059669" : score >= 70 ? "#2563EB" : score >= 55 ? "#D97706" : "#DC2626";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-3xl font-bold tabular-nums text-gray-900">{score}</span>
        {label && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
