/**
 * Guard Credential Score for Security Agency plan.
 * Score 0–100; stored in profiles.guard_credential_score.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

const WEIGHTS = {
  licenseActive: 30,
  noDisputes: 15,
  tenureStability: 20,
  referenceRate: 15,
  rehireEligible: 10,
  expiredLicense: -25,
  unresolvedDispute: -20,
};

export async function calculateCredentialScore(
  userId: string
): Promise<{ score: number; error?: string }> {
  const supabase = getSupabaseServer() as any;
  let raw = 0;
  const now = new Date().toISOString().slice(0, 10);

  try {
    const { data: licenses } = await supabase
      .from("guard_licenses")
      .select("id, status, expiration_date")
      .eq("user_id", userId);
    const licenseList = (licenses ?? []) as { status: string; expiration_date: string | null }[];
    const hasActive = licenseList.some(
      (l) => l.status === "active" || (l.expiration_date && l.expiration_date >= now && l.status !== "suspended")
    );
    const hasExpired = licenseList.some(
      (l) => l.status === "expired" || (l.expiration_date && l.expiration_date < now)
    );
    if (hasActive) raw += WEIGHTS.licenseActive;
    if (hasExpired) raw += WEIGHTS.expiredLicense;

    const { data: disputes } = await supabase
      .from("employer_disputes")
      .select("id, status")
      .eq("profile_id", userId);
    const disputeList = (disputes ?? []) as { status: string }[];
    const unresolved = disputeList.filter((d) => d.status !== "resolved" && d.status !== "closed");
    if (unresolved.length === 0) raw += WEIGHTS.noDisputes;
    if (unresolved.length > 0) raw += WEIGHTS.unresolvedDispute;

    const { data: jobs } = await supabase.from("jobs").select("id, start_date, end_date").eq("user_id", userId);
    const jobList = (jobs ?? []) as { start_date: string | null; end_date: string | null }[];
    let totalMonths = 0;
    for (const j of jobList) {
      const start = j.start_date ? new Date(j.start_date) : null;
      const end = j.end_date ? new Date(j.end_date) : null;
      if (start && end) totalMonths += (end.getTime() - start.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
      else if (start) totalMonths += (Date.now() - start.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
    }
    const avgTenure = jobList.length > 0 ? totalMonths / jobList.length : 0;
    if (avgTenure >= 18) raw += WEIGHTS.tenureStability;

    const { data: refs } = await supabase.from("references").select("id, response_status").or("from_user_id.eq." + userId + ",to_user_id.eq." + userId);
    const refList = (refs ?? []) as { response_status: string | null }[];
    const responded = refList.filter((r) => r.response_status === "completed" || r.response_status === "responded").length;
    const rate = refList.length > 0 ? responded / refList.length : 0;
    if (rate >= 0.6) raw += WEIGHTS.referenceRate;

    const { data: rehire } = await supabase.from("rehire_registry").select("rehire_eligible").eq("profile_id", userId).limit(1);
    const rehireRow = Array.isArray(rehire) ? rehire[0] : rehire;
    if ((rehireRow as { rehire_eligible?: boolean } | null)?.rehire_eligible === true) raw += WEIGHTS.rehireEligible;

    const score = Math.round(Math.max(0, Math.min(100, 50 + raw)));
    await supabase.from("profiles").update({ guard_credential_score: score }).eq("id", userId);
    return { score };
  } catch (e) {
    console.error("Credential score error:", e);
    return { score: 0, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
