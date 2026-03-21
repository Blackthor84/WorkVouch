/**
 * Guided 3-step onboarding: job → matches → first review.
 * Completion unlocks the full trust-profile loop in UX copy (metrics already accumulate incrementally).
 */

export const GUIDED_ONBOARDING_SKIPPED_KEY = "workvouch_guided_onboarding_skipped";

/** Set when the user has landed on the dashboard (trust header visible) — for checklist item "Review trust score". */
export const ONBOARDING_TRUST_REVIEWED_KEY = "workvouch_trust_dashboard_seen";

export type GuidedOnboardingStats = {
  jobsCount: number;
  matchesCount: number;
  referenceCount: number;
};

export type GuidedStep = 1 | 2 | 3 | "complete";

export function getGuidedStep(stats: GuidedOnboardingStats): GuidedStep {
  if (stats.jobsCount < 1) return 1;
  if (stats.matchesCount < 1) return 2;
  if (stats.referenceCount < 1) return 3;
  return "complete";
}

export function isGuidedProfileComplete(stats: GuidedOnboardingStats): boolean {
  return getGuidedStep(stats) === "complete";
}

/** Elite checklist row (server + optional client flag for trust viewed). */
export type EliteChecklistItem = {
  id: "job" | "profile" | "verification" | "trust";
  label: string;
  done: boolean;
  href: string;
};

export type EliteChecklistInput = GuidedOnboardingStats & {
  profileBasicsComplete: boolean;
  /** From localStorage on client; false on SSR. */
  trustDashboardSeen: boolean;
  /** Distinct coworkers who verified you (same as dashboard). */
  verifiedByCoworkers: number;
};

/**
 * Four-item activation checklist. Does not replace the 3-step guided flow — composes on top of the same stats.
 */
export function getEliteChecklistItems(input: EliteChecklistInput): EliteChecklistItem[] {
  const jobDone = input.jobsCount >= 1;
  const verificationDone = input.referenceCount >= 1 || input.verifiedByCoworkers >= 1;

  return [
    {
      id: "job",
      label: "Add your first job",
      done: jobDone,
      href: "/jobs/new?from=onboarding",
    },
    {
      id: "profile",
      label: "Complete profile basics",
      done: input.profileBasicsComplete,
      href: "/profile/edit",
    },
    {
      id: "verification",
      label: "Get 1 coworker verification",
      done: verificationDone,
      href: "/coworker-matches?from=onboarding",
    },
    {
      id: "trust",
      label: "Review your trust score",
      done: input.trustDashboardSeen,
      href: "/dashboard",
    },
  ];
}

export function getEliteCompletionPercent(items: EliteChecklistItem[]): number {
  if (items.length === 0) return 0;
  const done = items.filter((i) => i.done).length;
  return Math.round((done / items.length) * 100);
}
