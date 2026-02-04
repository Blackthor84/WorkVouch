/**
 * Employment match confidence (0–100). Populates employment_match_scores.
 * Called after employment record create/update (auto-match), and after employer confirm/dispute.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export async function recalculateMatchConfidence(employmentId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer() as any;
    const { data: rec } = await supabase
      .from("employment_records")
      .select("id, employer_id, company_name, company_normalized, verification_status")
      .eq("id", employmentId)
      .single();

    if (!rec) return;

    const hasEmployerLink = Boolean((rec as { employer_id?: string | null }).employer_id);
    const status = (rec as { verification_status?: string }).verification_status ?? "pending";
    const verified = status === "verified" || status === "matched";

    let score = 0;
    const breakdown: Record<string, number> = {};
    if (hasEmployerLink) {
      score += 35;
      breakdown.employer_linked = 35;
    }
    if (verified) {
      score += 45;
      breakdown.verification_status = 45;
    }
    const nameNorm = ((rec as { company_normalized?: string }).company_normalized ?? "").trim();
    if (nameNorm.length > 0) {
      score += 20;
      breakdown.company_normalized = 20;
    }
    const confidence = Math.min(100, score);

    await supabase
      .from("employment_match_scores")
      .upsert(
        {
          employment_id: employmentId,
          confidence_score: confidence,
          breakdown: { ...breakdown, total: confidence },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "employment_id" }
      );
  } catch (e) {
    console.error("[matchConfidence] recalculateMatchConfidence", e);
  }
}
