/**
 * Vertical-specific badges shown on profile/dashboard.
 * Conditions read from profile.vertical_metadata (or profile.vertical); does not affect scoring.
 */

export type VerticalBadge = {
  key: string;
  label: string;
  condition: (profile: { vertical?: string; vertical_metadata?: Record<string, unknown> }) => boolean;
};

export const verticalBadges: Record<string, VerticalBadge[]> = {
  Education: [
    {
      key: "multi_year_teacher",
      label: "Multi-Year Educator",
      condition: (p) =>
        Number((p.vertical_metadata as Record<string, unknown>)?.["years_teaching"]) >= 5,
    },
  ],

  Construction: [
    {
      key: "osha_certified",
      label: "OSHA Certified",
      condition: (p) =>
        (p.vertical_metadata as Record<string, unknown>)?.["osha_certified"] === "Yes",
    },
  ],

  Security: [
    {
      key: "armed_certified",
      label: "Armed Certified",
      condition: (p) =>
        (p.vertical_metadata as Record<string, unknown>)?.["armed_status"] === "Yes",
    },
  ],

  Healthcare: [
    {
      key: "licensed",
      label: "Licensed",
      condition: (p) =>
        Boolean((p.vertical_metadata as Record<string, unknown>)?.["license_type"]),
    },
  ],

  "Law Enforcement": [],
  Retail: [],
  Hospitality: [],
  "Warehouse and Logistics": [],
};

/** Resolve badges for a profile based on industry and vertical_metadata. */
export function getVerticalBadgesForProfile(profile: {
  industry?: string | null;
  vertical?: string | null;
  vertical_metadata?: Record<string, unknown> | null;
}): VerticalBadge[] {
  const industry = profile.industry ?? profile.vertical ?? null;
  if (!industry) return [];
  const list = verticalBadges[industry];
  if (!list) return [];
  return list.filter((badge) => badge.condition(profile as any));
}
