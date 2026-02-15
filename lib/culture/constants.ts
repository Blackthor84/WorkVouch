/**
 * Hidden culture systems — locked enums. Internal only.
 * Never expose these keys or any scores to users or employers.
 */

/** Job / workplace environment traits (one per vote; pick up to 3). Stored as trait_key in job_environment_traits. */
export const JOB_ENVIRONMENT_TRAIT_KEYS = [
  "FAST_PACED",
  "STEADY_PACED",
  "HIGH_PRESSURE",
  "LOW_STRESS",
  "HIGHLY_STRUCTURED",
  "FLEXIBLE",
  "BY_THE_BOOK",
  "FIGURE_IT_OUT",
  "HANDS_ON_MANAGEMENT",
  "HANDS_OFF_MANAGEMENT",
  "STRICT_RULES",
  "CHILL_LEADERSHIP",
  "TEAM_BASED",
  "INDEPENDENT",
  "CUSTOMER_FACING",
  "BEHIND_THE_SCENES",
] as const;

export type JobEnvironmentTraitKey = (typeof JOB_ENVIRONMENT_TRAIT_KEYS)[number];

/** Alias for JOB_ENVIRONMENT_TRAIT_KEYS. Same locked list. */
export const JOB_ENVIRONMENT_TRAITS = JOB_ENVIRONMENT_TRAIT_KEYS;

/** Human-readable labels for optional UI only (casual, not "rating"). */
export const JOB_ENVIRONMENT_TRAIT_LABELS: Record<JobEnvironmentTraitKey, string> = {
  FAST_PACED: "Fast-paced",
  STEADY_PACED: "Steady pace",
  HIGH_PRESSURE: "High pressure",
  LOW_STRESS: "Low stress",
  HIGHLY_STRUCTURED: "Highly structured",
  FLEXIBLE: "Flexible",
  BY_THE_BOOK: "By the book",
  FIGURE_IT_OUT: "Figure it out",
  HANDS_ON_MANAGEMENT: "Hands-on management",
  HANDS_OFF_MANAGEMENT: "Hands-off management",
  STRICT_RULES: "Strict rules",
  CHILL_LEADERSHIP: "Chill leadership",
  TEAM_BASED: "Team-based",
  INDEPENDENT: "Independent",
  CUSTOMER_FACING: "Customer-facing",
  BEHIND_THE_SCENES: "Behind the scenes",
};

/** Peer workstyle signal keys. Derived from behavior; never shown. */
export const PEER_WORKSTYLE_SIGNAL_KEYS = [
  "CONSISTENT_ATTENDANCE",
  "FREQUENT_LATENESS",
  "SHIFT_COVERING",
  "MISSED_CONFIRMATIONS",
  "LOW_FRICTION",
  "TEAM_POSITIVE",
  "ISOLATED",
  "REPEATED_CONFLICT",
  "GOES_ABOVE_EXPECTATIONS",
  "MEETS_MINIMUM",
  "BURNOUT_PATTERN",
  "HIGH_PEER_ALIGNMENT",
  "DISPUTED_VOUCHES",
  "OUTLIER_REPORTS",
] as const;

export type PeerWorkstyleSignalKey = (typeof PEER_WORKSTYLE_SIGNAL_KEYS)[number];

/** Alias for PEER_WORKSTYLE_SIGNAL_KEYS. Same locked list. */
export const PEER_WORKSTYLE_SIGNALS = PEER_WORKSTYLE_SIGNAL_KEYS;

/** Pairs of workstyle signals that conflict; when both present, confidence is reduced (not punitive). */
export const CONFLICT_PAIRS: Array<[string, string]> = [
  ["CONSISTENT_ATTENDANCE", "FREQUENT_LATENESS"],
  ["SHIFT_COVERING", "MISSED_CONFIRMATIONS"],
  ["LOW_FRICTION", "REPEATED_CONFLICT"],
  ["TEAM_POSITIVE", "ISOLATED"],
  ["GOES_ABOVE_EXPECTATIONS", "MEETS_MINIMUM"],
  ["GOES_ABOVE_EXPECTATIONS", "BURNOUT_PATTERN"],
  ["HIGH_PEER_ALIGNMENT", "OUTLIER_REPORTS"],
  ["HIGH_PEER_ALIGNMENT", "DISPUTED_VOUCHES"],
];

export const MAX_TRAITS_PER_VOTE = 3;
