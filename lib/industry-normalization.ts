/**
 * Industry normalization for enterprise intelligence.
 * Server-side only. Re-exports baselines and adds normalization helpers.
 */

import { getIndustryBaseline, safeRatio, type IndustryBaseline } from "@/lib/intelligence/baselines";

export { getIndustryBaseline, safeRatio, type IndustryBaseline };

const clamp = (n: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number.isFinite(n) ? n : 50));

/**
 * Normalize a raw metric (0–100) against industry baseline.
 * Returns 0–100. Neutral 50 if baseline missing or invalid.
 */
export async function normalizeToIndustry(
  rawValue: number,
  industryKey: string | null | undefined,
  baselineField: keyof IndustryBaseline
): Promise<number> {
  try {
    const baseline = await getIndustryBaseline(industryKey);
    const industryAvg = (baseline as unknown as Record<string, unknown>)[baselineField];
    const avg = Number(industryAvg);
    if (!Number.isFinite(avg) || avg <= 0) return clamp(rawValue);
    const ratio = safeRatio(rawValue, avg, 1);
    return clamp(50 * ratio * (baseline.risk_weight ?? 1));
  } catch {
    return clamp(rawValue);
  }
}

/**
 * Resolve industry key from profile/employer. Default "corporate".
 */
export function resolveIndustryKey(
  industryKey: string | null | undefined,
  industryEnum: string | null | undefined
): string {
  const key = (industryKey && String(industryKey).trim()) || "";
  if (key) return key.toLowerCase();
  const e = (industryEnum && String(industryEnum).trim()) || "";
  if (!e) return "corporate";
  const map: Record<string, string> = {
    security: "security",
    healthcare: "healthcare",
    warehousing: "logistics",
    warehouse: "logistics",
    retail: "retail",
    hospitality: "hospitality",
    law_enforcement: "security",
    corporate: "corporate",
    logistics: "logistics",
    technology: "technology",
  };
  return map[e.toLowerCase()] || "corporate";
}
