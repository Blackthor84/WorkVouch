/**
 * Platform verticals: which verticals are enabled for UI/API.
 * Hide education + construction unless platform_verticals.enabled or ENABLE_VERTICAL_X.
 * No scoring logic — only visibility.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

export const VERTICAL_DEFAULT = "default";
export const VERTICAL_EDUCATION = "education";
export const VERTICAL_CONSTRUCTION = "construction";

export const ALL_VERTICAL_KEYS = [
  VERTICAL_DEFAULT,
  VERTICAL_EDUCATION,
  VERTICAL_CONSTRUCTION,
] as const;

function envEnabled(name: string): boolean {
  const key = `ENABLE_VERTICAL_${name.toUpperCase()}`;
  return process.env[key] === "true";
}

/**
 * Returns vertical names that are enabled for UI (platform_verticals.enabled or env).
 */
export async function getEnabledVerticalNames(): Promise<string[]> {
  const supabase = getServiceRoleClient();
  const { data: rows } = await supabase
    .from("platform_verticals")
    .select("name, enabled");
  const list = (rows ?? []) as { name: string; enabled: boolean }[];
  const out: string[] = [];
  for (const row of list) {
    if (row.enabled || envEnabled(row.name)) out.push(row.name);
  }
  return out.length > 0 ? out : [VERTICAL_DEFAULT];
}
