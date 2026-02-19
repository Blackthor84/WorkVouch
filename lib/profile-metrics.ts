/**
 * Silent profile_metrics upsert. No UI.
 * Call from triggerProfileIntelligence after trust, stability, network, rehire, risk run.
 * Stores: stability_score, reference_score, rehire_score, dispute_score, credential_score, network_score, fraud_score.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n))));

function safeLog(err: unknown): void {
  try {
    if (typeof console !== "undefined" && console.error) {
      console.error("[profile-metrics]", err);
    }
  } catch {
    // no-op
  }
}

export async function upsertProfileMetrics(profileId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer() as any;

    const { data: jobs } = await supabase.from("jobs").select("id, start_date, end_date, verification_status").eq("user_id", profileId);
    const jobList = (jobs ?? []) as { id: string; start_date: string; end_date: string | null; verification_status?: string }[];
    let tenureMonths = 0;
    for (const j of jobList) {
      const s = new Date(j.start_date).getTime();
      const e = j.end_date ? new Date(j.end_date).getTime() : Date.now();
      if (e > s) tenureMonths += (e - s) / (30.44 * 24 * 60 * 60 * 1000);
    }
    const stability_score = clamp(Math.min(100, (tenureMonths / 24) * 100));

    const jids = jobList.map((j) => j.id);
    let refTotal = jids.length;
    let refResponded = 0;
    if (jids.length > 0) {
      const { count } = await supabase.from("user_references").select("id", { count: "exact", head: true }).eq("to_user_id", profileId);
      refResponded = count ?? 0;
    }
    const reference_score = refTotal > 0 ? clamp((refResponded / refTotal) * 100) : 100;

    const { data: rehireRows } = await supabase.from("rehire_registry").select("rehire_eligible").eq("profile_id", profileId);
    const rehireEligible = ((rehireRows ?? []) as { rehire_eligible: boolean }[]).some((r) => r.rehire_eligible);
    const rehire_score = rehireEligible ? 85 : clamp(40 + Math.min(30, jobList.length * 10));

    let dispute_score = 100;
    if (jids.length > 0) {
      const { data: disp } = await supabase.from("employer_disputes").select("id, status").in("job_id", jids);
      const list = (disp ?? []) as { status: string }[];
      const resolved = list.filter((d) => d.status === "resolved").length;
      const total = list.length;
      dispute_score = total > 0 ? clamp((resolved / total) * 100) : 100;
    }

    let credential_score = 0;
    try {
      const { data: profileRow } = await supabase.from("profiles").select("guard_credential_score").eq("id", profileId).maybeSingle();
      const guardScore = (profileRow as { guard_credential_score?: number | null } | null)?.guard_credential_score;
      if (guardScore != null && Number.isFinite(guardScore)) credential_score = clamp(guardScore);
    } catch {
      // ignore
    }
    if (credential_score === 0) {
      try {
        const { data: cred } = await supabase.from("guard_licenses").select("id").eq("user_id", profileId);
        const count = Array.isArray(cred) ? cred.length : 0;
        credential_score = count > 0 ? Math.min(100, count * 25) : 0;
      } catch {
        // guard_licenses may not exist
      }
    }

    let network_score = 0;
    try {
      const { data: profileRow } = await supabase.from("profiles").select("network_density_score").eq("id", profileId).maybeSingle();
      const nd = (profileRow as { network_density_score?: number | null } | null)?.network_density_score;
      if (nd != null && Number.isFinite(nd)) network_score = clamp(nd);
    } catch {
      // ignore
    }
    if (network_score === 0 && jids.length > 0) {
      const { data: refs } = await supabase.from("user_references").select("id").eq("to_user_id", profileId);
      const refCount = Array.isArray(refs) ? refs.length : 0;
      network_score = clamp((refCount / Math.max(jids.length * 2, 1)) * 100);
    }

    const fraud_score = 0;

    await supabase.from("profile_metrics").upsert(
      {
        user_id: profileId,
        stability_score,
        reference_score,
        rehire_score,
        dispute_score,
        credential_score,
        network_score,
        fraud_score,
        last_calculated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (e) {
    safeLog(e);
  }
}
