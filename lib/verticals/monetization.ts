/**
 * Vertical-specific monetization: premium insights and enterprise add-ons.
 * Used on pricing page to show industry-specific upgrades. Does not affect scoring.
 */

export const verticalMonetization: Record<
  string,
  { premiumInsights: string[]; enterpriseAddOns: string[] }
> = {
  Education: {
    premiumInsights: [
      "Behavioral trend analysis",
      "Classroom stability index",
    ],
    enterpriseAddOns: ["District-level intelligence dashboard"],
  },

  Construction: {
    premiumInsights: [
      "Project reliability score",
      "Crew trust index",
    ],
    enterpriseAddOns: ["Multi-site workforce intelligence"],
  },

  Security: {
    premiumInsights: [
      "Compliance alignment score",
      "Peer verification density",
    ],
    enterpriseAddOns: ["Site-level intelligence dashboard"],
  },

  Healthcare: {
    premiumInsights: [
      "Tenure stability index",
      "Peer validation density",
    ],
    enterpriseAddOns: ["Facility-level intelligence dashboard"],
  },

  "Law Enforcement": {
    premiumInsights: [
      "Service record consistency",
      "Peer confidence index",
    ],
    enterpriseAddOns: ["Department-level intelligence dashboard"],
  },

  Retail: {
    premiumInsights: [
      "Customer-facing reliability score",
      "Team endorsement index",
    ],
    enterpriseAddOns: ["Multi-location workforce intelligence"],
  },

  Hospitality: {
    premiumInsights: [
      "Guest-facing reliability score",
      "Sentiment stability index",
    ],
    enterpriseAddOns: ["Property-level intelligence dashboard"],
  },

  "Warehouse and Logistics": {
    premiumInsights: [
      "Shift reliability score",
      "Retention index",
    ],
    enterpriseAddOns: ["Site-level workforce intelligence"],
  },
};

/** Get monetization config for an industry. */
export function getVerticalMonetization(industry: string | null | undefined): {
  premiumInsights: string[];
  enterpriseAddOns: string[];
} | null {
  if (!industry) return null;
  return verticalMonetization[industry] ?? null;
}
