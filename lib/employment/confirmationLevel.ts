/**
 * Update employment_records.confirmation_level from peer_confirmation_count and employer_confirmation_status.
 * Logic: peer_confirmation_count >= 2 → peer_confirmed; employer_confirmation_status = approved → employer_confirmed; both → multi_confirmed.
 * Does not block profile legitimacy on employer confirmation.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type ConfirmationLevel = "self_reported" | "peer_confirmed" | "employer_confirmed" | "multi_confirmed";

export async function updateConfirmationLevel(employmentId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer() as any;
    const { data: rec } = await supabase
      .from("employment_records")
      .select("id, peer_confirmation_count, employer_confirmation_status, verification_status")
      .eq("id", employmentId)
      .single();

    if (!rec) return;

    const peerCount = Number((rec as { peer_confirmation_count?: number }).peer_confirmation_count) || 0;
    const employerStatus = (rec as { employer_confirmation_status?: string }).employer_confirmation_status;
    const verificationStatus = (rec as { verification_status?: string }).verification_status ?? "";
    const employerApproved = employerStatus === "approved" || verificationStatus === "verified";

    let level: ConfirmationLevel = "self_reported";
    if (peerCount >= 2 && employerApproved) level = "multi_confirmed";
    else if (employerApproved) level = "employer_confirmed";
    else if (peerCount >= 2) level = "peer_confirmed";

    const weight = level === "multi_confirmed" ? 100 : level === "employer_confirmed" ? 80 : level === "peer_confirmed" ? 70 : 30;

    await supabase
      .from("employment_records")
      .update({
        confirmation_level: level,
        employer_confirmation_status: employerApproved ? "approved" : (employerStatus ?? null),
        confirmation_weight_score: weight,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employmentId);
  } catch (e) {
    console.error("[confirmationLevel] updateConfirmationLevel", e);
  }
}
