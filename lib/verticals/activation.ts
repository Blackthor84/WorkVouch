/**
 * Vertical activation: read from platform_verticals table.
 * When disabled: hide onboarding fields, badges, monetization upgrades for that vertical.
 * Does not affect scoring or DB storage (data still supported).
 */


/** Map industry display name to platform_verticals.name (DB). */
export function industryToVerticalName(industry: string): string {
  const normalized = industry?.trim().toLowerCase().replace(/\s+and\s+/g, "_").replace(/\s+/g, "_") ?? "";
  const map: Record<string, string> = {
    education: "education",
    construction: "construction",
    security: "security",
    healthcare: "healthcare",
    "law_enforcement": "law_enforcement",
    retail: "retail",
    hospitality: "hospitality",
    "warehouse_and_logistics": "warehouse_and_logistics",
  };
  return map[normalized] ?? normalized;
}

/** Map platform_verticals.name to industry display name. */
export function verticalNameToIndustry(name: string): string {
  const map: Record<string, string> = {
    education: "Education",
    construction: "Construction",
    security: "Security",
    healthcare: "Healthcare",
    law_enforcement: "Law Enforcement",
    retail: "Retail",
    hospitality: "Hospitality",
    warehouse_and_logistics: "Warehouse and Logistics",
    default: "Default",
  };
  return map[name?.toLowerCase() ?? ""] ?? name ?? "";
}

/** All vertical names we store in platform_verticals (for admin list). */
export const VERTICAL_NAMES: string[] = [
  "education",
  "construction",
  "security",
  "healthcare",
  "law_enforcement",
  "retail",
  "hospitality",
  "warehouse_and_logistics",
];

/** Industry display names in same order for admin UI. */
export const VERTICAL_DISPLAY_NAMES: Record<string, string> = {
  education: "Education",
  construction: "Construction",
  security: "Security",
  healthcare: "Healthcare",
  law_enforcement: "Law Enforcement",
  retail: "Retail",
  hospitality: "Hospitality",
  warehouse_and_logistics: "Warehouse and Logistics",
  default: "Default",
};

export type PlatformVerticalRow = { id: string; name: string; enabled: boolean; created_at?: string };

/**
 * Check if a vertical is enabled (server-side). Pass industry display name e.g. "Education".
 * Used to hide onboarding fields, badges, monetization when vertical is disabled.
 */
export async function getVerticalEnabled(
  industry: string | null | undefined,
  supabase: any
): Promise<boolean> {
  if (!industry) return false;
  const name = industryToVerticalName(industry);
  if (!name) return false;
  try {
    const { data } = await supabase
      .from("platform_verticals")
      .select("enabled")
      .eq("name", name)
      .maybeSingle();
    return Boolean(data?.enabled);
  } catch {
    return false;
  }
}
