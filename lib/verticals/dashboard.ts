/**
 * Vertical-specific dashboard metrics.
 * Layer on top of core scoring; do not replace it.
 * Profile shape: { tenure_months?, sentiment_average?, profile_strength?, vertical_metadata?, ... }
 */

export type VerticalDashboardMetric = {
  key: string;
  label: string;
  description: string;
  compute: (profile: VerticalDashboardProfile) => number | string | null;
};

export type VerticalDashboardProfile = {
  tenure_months?: number | null;
  sentiment_average?: number | null;
  profile_strength?: number | null;
  vertical_metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export const verticalDashboards: Record<string, VerticalDashboardMetric[]> = {
  Education: [
    {
      key: "classroom_stability",
      label: "Classroom Stability Index",
      description: "Measures long-term teaching continuity.",
      compute: (p) =>
        p.tenure_months != null
          ? Math.min(Math.log(p.tenure_months + 1) * 5, 100)
          : 0,
    },
    {
      key: "behavioral_sentiment",
      label: "Behavioral Sentiment Score",
      description: "Derived from peer feedback tone.",
      compute: (p) =>
        p.sentiment_average != null
          ? Math.round((p.sentiment_average + 1) * 50)
          : 50,
    },
  ],

  Construction: [
    {
      key: "crew_reliability",
      label: "Crew Reliability Index",
      description: "Consistency + peer sentiment.",
      compute: (p) => p.profile_strength ?? 0,
    },
    {
      key: "project_stability",
      label: "Project Stability Score",
      description: "Tenure stability across job sites.",
      compute: (p) => p.tenure_months ?? 0,
    },
  ],

  Security: [
    {
      key: "reliability_index",
      label: "Reliability Index",
      description: "Core profile strength for security roles.",
      compute: (p) => p.profile_strength ?? 0,
    },
    {
      key: "tenure_stability",
      label: "Tenure Stability",
      description: "Stability across assignments.",
      compute: (p) => p.tenure_months ?? 0,
    },
  ],

  Healthcare: [
    {
      key: "practice_stability",
      label: "Practice Stability",
      description: "Tenure and continuity.",
      compute: (p) => p.tenure_months ?? 0,
    },
    {
      key: "peer_sentiment",
      label: "Peer Sentiment",
      description: "Derived from peer feedback.",
      compute: (p) =>
        p.sentiment_average != null
          ? Math.round((p.sentiment_average + 1) * 50)
          : 50,
    },
  ],

  "Law Enforcement": [
    {
      key: "service_stability",
      label: "Service Stability",
      description: "Tenure and continuity.",
      compute: (p) => p.tenure_months ?? 0,
    },
    {
      key: "reliability_index",
      label: "Reliability Index",
      description: "Core profile strength.",
      compute: (p) => p.profile_strength ?? 0,
    },
  ],

  Retail: [
    {
      key: "reliability_index",
      label: "Reliability Index",
      description: "Core profile strength.",
      compute: (p) => p.profile_strength ?? 0,
    },
    {
      key: "tenure_stability",
      label: "Tenure Stability",
      description: "Job stability.",
      compute: (p) => p.tenure_months ?? 0,
    },
  ],

  Hospitality: [
    {
      key: "reliability_index",
      label: "Reliability Index",
      description: "Core profile strength.",
      compute: (p) => p.profile_strength ?? 0,
    },
    {
      key: "tenure_stability",
      label: "Tenure Stability",
      description: "Job stability.",
      compute: (p) => p.tenure_months ?? 0,
    },
  ],

  "Warehouse and Logistics": [
    {
      key: "reliability_index",
      label: "Reliability Index",
      description: "Core profile strength.",
      compute: (p) => p.profile_strength ?? 0,
    },
    {
      key: "tenure_stability",
      label: "Tenure Stability",
      description: "Job stability.",
      compute: (p) => p.tenure_months ?? 0,
    },
  ],
};

export function getVerticalDashboardConfig(
  industry: string | null | undefined
): VerticalDashboardMetric[] | null {
  if (!industry?.trim()) return null;
  return verticalDashboards[industry.trim()] ?? null;
}
