"use client";

import {
  ArrowTrendingUpIcon,
  MinusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export type TrustTrajectoryValue = "improving" | "stable" | "at_risk";

const TRAJECTORY_CONFIG: Record<
  TrustTrajectoryValue,
  { label: string; Icon: React.ComponentType<{ className?: string }>; colorClass: string }
> = {
  improving: {
    label: "⬆ Improving",
    Icon: ArrowTrendingUpIcon,
    colorClass: "text-emerald-600 dark:text-emerald-400",
  },
  stable: {
    label: "➡ Stable",
    Icon: MinusIcon,
    colorClass: "text-blue-600 dark:text-blue-400",
  },
  at_risk: {
    label: "⬇ At Risk",
    Icon: ExclamationTriangleIcon,
    colorClass: "text-amber-600 dark:text-amber-400",
  },
};

export interface TrustTrajectoryBadgeProps {
  trajectory: TrustTrajectoryValue;
  label?: string;
  tooltipFactors?: string[];
  size?: "sm" | "md";
}

/** Displays Trust Trajectory with icon and label. Tooltip explains the factors. */
export function TrustTrajectoryBadge({
  trajectory,
  label,
  tooltipFactors = [],
  size = "md",
}: TrustTrajectoryBadgeProps) {
  const config = TRAJECTORY_CONFIG[trajectory];
  const Icon = config.Icon;
  const displayLabel = config.label;
  const tooltipText =
    tooltipFactors.length > 0
      ? `Factors: ${tooltipFactors.join("; ")}`
      : "Indicates how this profile's trust signals are trending based on verification recency, peer references, and dispute outcomes.";

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${config.colorClass} ${textSize} font-medium`}
      title={tooltipText}
    >
      <Icon className={`${iconSize} flex-shrink-0`} aria-hidden />
      <span>{displayLabel}</span>
    </span>
  );
}
