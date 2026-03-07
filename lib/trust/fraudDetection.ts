/**
 * Fraud detection: suspicious verification patterns.
 * Rule 1: Same 3 users verify each other in a loop → verification ring.
 * Rule 2: Multiple verifications from accounts created within 24 hours → suspicious.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type FraudDetectionResult = {
  suspicious: boolean;
  reason: string;
};

type Edge = { source: string; target: string };

/**
 * Detect verification ring: 3 distinct profiles that form a cycle in trust_relationships.
 */
function detectVerificationRing(edges: Edge[]): boolean {
  const bySource = new Map<string, string[]>();
  for (const e of edges) {
    if (!bySource.has(e.source)) bySource.set(e.source, []);
    bySource.get(e.source)!.push(e.target);
  }
  for (const start of bySource.keys()) {
    const second = bySource.get(start) ?? [];
    for (const s of second) {
      const third = bySource.get(s) ?? [];
      for (const t of third) {
        const back = bySource.get(t) ?? [];
        if (back.includes(start)) return true;
      }
    }
  }
  return false;
}

/**
 * Check if multiple profiles involved in recent events were created within the same 24h window.
 */
function detectNewAccountCluster(
  profileCreatedAts: { profile_id: string; created_at: string }[]
): boolean {
  if (profileCreatedAts.length < 2) return false;
  const sorted = [...profileCreatedAts].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    const t1 = new Date(sorted[i].created_at).getTime();
    const t2 = new Date(sorted[i + 1].created_at).getTime();
    if (Math.abs(t2 - t1) < 24 * 60 * 60 * 1000) return true;
  }
  return false;
}

/**
 * Run fraud detection. Uses trust_relationships and recent trust_events + profiles.
 */
export async function runFraudDetection(
  supabase: SupabaseClient
): Promise<FraudDetectionResult> {
  const { data: relRows } = await supabase
    .from("trust_relationships")
    .select("source_profile_id, target_profile_id");

  const edges: Edge[] = ((relRows ?? []) as unknown as { source_profile_id: string; target_profile_id: string }[]).map(
    (r) => ({ source: r.source_profile_id, target: r.target_profile_id })
  );

  if (detectVerificationRing(edges)) {
    return { suspicious: true, reason: "Verification ring: same 3 users verify each other in a loop." };
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const iso = sevenDaysAgo.toISOString();

  const { data: eventRows } = await supabase
    .from("trust_events")
    .select("profile_id")
    .gte("created_at", iso)
    .in("event_type", ["coworker_verification_confirmed", "coworker_verified", "verification_confirmed", "employment_verified"]);

  const profileIds = [
    ...new Set(
      ((eventRows ?? []) as unknown as { profile_id: string }[]).map((r) => r.profile_id)
    ),
  ];
  if (profileIds.length === 0) {
    return { suspicious: false, reason: "" };
  }

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, created_at")
    .in("id", profileIds);

  const createdAts = ((profileRows ?? []) as unknown as { id: string; created_at: string }[]).map(
    (p) => ({ profile_id: p.id, created_at: p.created_at })
  );

  if (detectNewAccountCluster(createdAts)) {
    return {
      suspicious: true,
      reason: "Multiple verifications come from accounts created within 24 hours.",
    };
  }

  return { suspicious: false, reason: "" };
}
