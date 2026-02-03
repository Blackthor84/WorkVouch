/**
 * Enterprise metrics: real unified intelligence outputs only. No Math.random.
 * Used by request-verification to optionally store real metrics (enterprise_metrics).
 * Never throws; returns neutral values on failure.
 */

import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import { calculateUnifiedIntelligence } from "@/lib/intelligence/unified-intelligence";

export async function calculateEnterpriseMetrics(
  userId: string,
  employerId?: string
): Promise<{
  rehire_probability: number;
  compatibility_score: number;
  workforce_risk_score: number;
  integrity_index: number;
} | null> {
  try {
    const result = await calculateUnifiedIntelligence(userId, employerId ?? null);
    return {
      rehire_probability: result.rehire_probability,
      compatibility_score: result.team_fit_score ?? result.profile_strength,
      workforce_risk_score: 100 - result.overall_risk_score,
      integrity_index: result.career_health,
    };
  } catch {
    const snapshot = await getOrCreateSnapshot(userId).catch(() => null);
    if (!snapshot) {
      return { rehire_probability: 0, compatibility_score: 50, workforce_risk_score: 50, integrity_index: 0 };
    }
    return {
      rehire_probability: snapshot.rehire_score ?? 0,
      compatibility_score: snapshot.profile_strength ?? 50,
      workforce_risk_score: 50,
      integrity_index: snapshot.career_health_score ?? 0,
    };
  }
}
