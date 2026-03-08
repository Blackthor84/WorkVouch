"use client";

export type ConfidenceTier = "new" | "trusted" | "verified" | "elite";

export function getConfidenceTier(score: number): ConfidenceTier {
  if (score < 30) return "new";
  if (score < 60) return "trusted";
  if (score < 90) return "verified";
  return "elite";
}

export function getConfidenceTierLabel(tier: ConfidenceTier): string {
  switch (tier) {
    case "new":
      return "New Profile";
    case "trusted":
      return "Trusted Worker";
    case "verified":
      return "Verified Professional";
    case "elite":
      return "Elite Verified";
    default:
      return "New Profile";
  }
}

const tierStyles: Record<
  ConfidenceTier,
  { bg: string; text: string; border: string }
> = {
  new: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-600",
  },
  trusted: {
    bg: "bg-blue-50 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700",
  },
  verified: {
    bg: "bg-green-50 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-700",
  },
  elite: {
    bg: "bg-amber-50 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-200",
    border: "border-amber-300 dark:border-amber-600",
  },
};

interface TrustBadgeTierProps {
  /** Confidence score in points. */
  score: number;
  className?: string;
}

/**
 * Trust badge tier for profiles: New Profile &lt; 30, Trusted Worker 30–59, Verified Professional 60–89, Elite Verified 90+.
 */
export function TrustBadgeTier({ score, className = "" }: TrustBadgeTierProps) {
  const tier = getConfidenceTier(score);
  const label = getConfidenceTierLabel(tier);
  const style = tierStyles[tier];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${style.bg} ${style.text} ${style.border} ${className}`}
      title={`Confidence: ${score} pts — ${label}`}
    >
      {label}
    </span>
  );
}
