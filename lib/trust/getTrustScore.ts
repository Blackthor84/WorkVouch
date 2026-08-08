/**
 * @deprecated Use calculateTrust from @/lib/trust/trustEngine.
 * Kept for backward compatibility with resume export and recruiter APIs.
 */

import { calculateTrust } from "@/lib/trust/trustEngine";

export type GetTrustScoreResult = {
  trustScore: number;
  verificationCount: number;
};

export async function getTrustScore(profileId: string): Promise<GetTrustScoreResult> {
  const result = await calculateTrust(profileId);
  return {
    trustScore: result.score,
    verificationCount: result.referenceCount,
  };
}
