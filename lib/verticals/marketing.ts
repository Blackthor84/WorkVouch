/**
 * Vertical-specific marketing: headlines, pain points, CTAs.
 * Used by /verticals/[industry] landing pages.
 */

export type VerticalMarketingConfig = {
  headline: string;
  subheadline: string;
  painPoints: string[];
  cta: string;
};

export const verticalMarketing: Record<string, VerticalMarketingConfig> = {
  Education: {
    headline: "Hire Teachers with Verified Classroom Intelligence",
    subheadline:
      "Move beyond resumes. See stability, peer sentiment, and rehire signals.",
    painPoints: [
      "Hidden classroom performance issues",
      "Unverified references",
      "High turnover",
    ],
    cta: "Start Verifying Educators",
  },

  Construction: {
    headline: "Build Teams You Can Trust",
    subheadline: "Crew reliability, safety signals, and verified overlap.",
    painPoints: [
      "Job-site turnover",
      "Safety concerns",
      "Unverified work history",
    ],
    cta: "Build Your Verified Workforce",
  },

  Security: {
    headline: "Trust Beyond the Badge",
    subheadline:
      "See verified overlap, sentiment, and rehire confidence.",
    painPoints: [
      "Risk exposure",
      "Reputation damage",
      "Unverified guard performance",
    ],
    cta: "Secure Your Workforce",
  },

  Healthcare: {
    headline: "Verify Caregivers with Confidence",
    subheadline: "License signals, tenure stability, and peer sentiment.",
    painPoints: [
      "Unverified credentials",
      "Turnover in care roles",
      "Reference gaps",
    ],
    cta: "Verify Your Care Team",
  },

  "Law Enforcement": {
    headline: "Verified Service History for Your Department",
    subheadline: "Tenure, peer feedback, and rehire signals.",
    painPoints: [
      "Unverified service records",
      "Reference gaps",
      "Turnover risk",
    ],
    cta: "Verify Your Team",
  },

  Retail: {
    headline: "Hire Retail Talent You Can Rely On",
    subheadline: "Stability and peer-verified performance.",
    painPoints: [
      "High turnover",
      "Unverified references",
      "Performance gaps",
    ],
    cta: "Start Verifying",
  },

  Hospitality: {
    headline: "Verified Hospitality Talent",
    subheadline: "Stability and peer sentiment for front-of-house and back.",
    painPoints: [
      "Seasonal turnover",
      "Unverified references",
      "Customer-facing risk",
    ],
    cta: "Verify Your Team",
  },

  "Warehouse and Logistics": {
    headline: "Build a Verified Logistics Workforce",
    subheadline: "Certifications, tenure, and reliability signals.",
    painPoints: [
      "Safety and certification gaps",
      "Unverified tenure",
      "Turnover",
    ],
    cta: "Build Your Verified Workforce",
  },
};

export function getVerticalMarketing(
  industry: string | null | undefined
): VerticalMarketingConfig | null {
  if (!industry?.trim()) return null;
  return verticalMarketing[industry.trim()] ?? null;
}

/** URL slug -> display name for /verticals/[industry] routes. */
const SLUG_TO_INDUSTRY: Record<string, string> = {
  education: "Education",
  construction: "Construction",
  security: "Security",
  healthcare: "Healthcare",
  "law-enforcement": "Law Enforcement",
  law_enforcement: "Law Enforcement",
  retail: "Retail",
  hospitality: "Hospitality",
  "warehouse-and-logistics": "Warehouse and Logistics",
  warehouse_and_logistics: "Warehouse and Logistics",
};

export function getVerticalMarketingBySlug(
  slug: string | null | undefined
): VerticalMarketingConfig | null {
  if (!slug?.trim()) return null;
  const normalized = slug.trim().toLowerCase().replace(/_/g, "-");
  const industry = SLUG_TO_INDUSTRY[normalized] ?? slug.trim();
  return verticalMarketing[industry] ?? null;
}
