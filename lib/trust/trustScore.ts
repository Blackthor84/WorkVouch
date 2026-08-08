/**
 * @deprecated Use calculateTrust from @/lib/trust/trustEngine.
 * Kept for backward compatibility with resume export and workvouch profile API.
 */

import { calculateTrust } from "@/lib/trust/trustEngine";

export async function calculateTrustScore(profileId: string): Promise<number> {
  const result = await calculateTrust(profileId);
  return result.score;
}
