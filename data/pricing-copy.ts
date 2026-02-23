/**
 * Pricing page copy that converts.
 * You are not selling plans — you are selling confidence, speed, and risk reduction.
 * Use conversion CTAs instead of "Upgrade to Pro".
 */

export const PRICING_HEADLINE = "Hire with proof, not promises.";

export const PRICING_SUBHEADLINE =
  "Verified coworker consensus replaces guesswork in hiring.";

/** Tier framing (do NOT rename tiers: free, starter, pro, enterprise). */
export const TIER_COPY = {
  free: {
    whoIsFor: "For exploring verified employment",
    bullets: [
      "Trust score preview",
      "Reference summaries",
      "Limited candidate views",
    ],
    cta: "Start verifying candidates",
  },
  starter: {
    whoIsFor: "For small teams making real hiring decisions",
    bullets: [
      "Full coworker references",
      "Verified employment timelines",
      "More candidate views",
    ],
    cta: "Hire with confidence",
  },
  pro: {
    whoIsFor: "For teams hiring at scale",
    bullets: [
      "Trust explanations",
      "Fraud & abuse signals",
      "Hiring outcome simulator",
      "Trust report exports",
    ],
    cta: "Reduce hiring risk",
  },
  enterprise: {
    whoIsFor: "For organizations where trust is critical",
    bullets: [
      "API access",
      "ATS integration",
      "Audit logs",
      "Custom limits & contracts",
    ],
    cta: "Talk to sales",
  },
} as const;

/**
 * Conversion copy: use these instead of "Upgrade to Pro".
 * Intent routing, not pricing logic.
 */
export const CONVERSION_CTAS = {
  seeHowScoreCalculated: "See how this score was calculated",
  exportTrustReport: "Export this trust report",
  addTeamMember: "Add a team member",
  integrateHiringWorkflow: "Integrate into your hiring workflow",
} as const;

/** Seat limit reached — capability framing, not "pay more". */
export const SEAT_LIMIT_MESSAGE =
  "You've reached your included team member limit.";
