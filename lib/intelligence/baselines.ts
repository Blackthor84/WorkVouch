/**
 * Industry benchmarks for normalized scoring.
 * Safe fallbacks: never divide by zero; use corporate defaults if baseline missing.
 */

export interface IndustryBaseline {
  industry_key: string;
  avg_tenure_months: number;
  avg_reference_response_rate: number;
  avg_dispute_rate: number;
  avg_rehire_rate: number;
  avg_gap_months: number;
  risk_weight: number;
}

const CORPORATE_DEFAULT: IndustryBaseline = {
  industry_key: "corporate",
  avg_tenure_months: 36,
  avg_reference_response_rate: 0.8,
  avg_dispute_rate: 0.03,
  avg_rehire_rate: 0.7,
  avg_gap_months: 2,
  risk_weight: 1,
};

const SAFE_NUM = (n: unknown, fallback: number): number => {
  const v = Number(n);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};

/**
 * Fetch industry baseline from DB. Returns corporate default if missing or on error.
 */
export async function getIndustryBaseline(industryKey: string | null | undefined): Promise<IndustryBaseline> {
  const key = (industryKey && String(industryKey).trim()) || "corporate";
  try {
    const { getSupabaseServer } = await import("@/lib/supabase/admin");
    const supabase = getSupabaseServer() as any;
    const { data, error } = await supabase
      .from("industry_benchmarks")
      .select("industry_key, avg_tenure_months, avg_reference_response_rate, avg_dispute_rate, avg_rehire_rate, avg_gap_months, risk_weight")
      .eq("industry_key", key)
      .maybeSingle();
    if (error || !data) return CORPORATE_DEFAULT;
    return {
      industry_key: (data as IndustryBaseline).industry_key ?? key,
      avg_tenure_months: SAFE_NUM((data as any).avg_tenure_months, CORPORATE_DEFAULT.avg_tenure_months),
      avg_reference_response_rate: SAFE_NUM((data as any).avg_reference_response_rate, CORPORATE_DEFAULT.avg_reference_response_rate) || 0.5,
      avg_dispute_rate: SAFE_NUM((data as any).avg_dispute_rate, CORPORATE_DEFAULT.avg_dispute_rate) || 0.01,
      avg_rehire_rate: SAFE_NUM((data as any).avg_rehire_rate, CORPORATE_DEFAULT.avg_rehire_rate) || 0.5,
      avg_gap_months: SAFE_NUM((data as any).avg_gap_months, CORPORATE_DEFAULT.avg_gap_months) || 1,
      risk_weight: SAFE_NUM((data as any).risk_weight, 1) || 1,
    };
  } catch {
    return CORPORATE_DEFAULT;
  }
}

/** Safe ratio: num/denom, or fallback if denom is 0 or invalid. */
export function safeRatio(num: number, denom: number, fallback: number): number {
  if (!Number.isFinite(num) || !Number.isFinite(denom) || denom <= 0) return fallback;
  return num / denom;
}
