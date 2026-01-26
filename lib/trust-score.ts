/**
 * Trust Score Engine
 * 
 * Calculates 0-100 trust score based on:
 * - Coworker agreement
 * - Peer reliability history
 * - Number of verified coworkers
 * - Job history consistency
 * - Flags vs endorsements
 * 
 * Outputs:
 * - Basic (Starter tier): Simple score
 * - Advanced (Team/Pro): Detailed breakdown
 */

export interface TrustScoreInputs {
  coworkerAgreement: number; // 0-1, percentage of coworkers who verified
  peerReliabilityHistory: number; // 0-1, average reliability of peers
  verifiedCoworkersCount: number; // Number of verified coworkers
  jobHistoryConsistency: number; // 0-1, consistency score
  flagsCount: number; // Number of flags/disputes
  endorsementsCount: number; // Number of positive endorsements
}

export interface TrustScoreOutput {
  score: number; // 0-100
  tier: "basic" | "advanced";
  breakdown?: {
    coworkerAgreement: number;
    peerReliability: number;
    verificationCount: number;
    consistency: number;
    reputation: number;
  };
}

/**
 * Calculate trust score
 */
export function calculateTrustScore(
  inputs: TrustScoreInputs,
  tier: "basic" | "advanced" = "basic"
): TrustScoreOutput {
  // Weighted components
  const weights = {
    coworkerAgreement: 0.30, // 30% - Most important
    peerReliability: 0.25, // 25%
    verificationCount: 0.20, // 20%
    consistency: 0.15, // 15%
    reputation: 0.10, // 10%
  };

  // Normalize verification count (0-10+ coworkers = 0-1 score)
  const normalizedVerificationCount = Math.min(inputs.verifiedCoworkersCount / 10, 1);

  // Calculate reputation (flags reduce, endorsements increase)
  const reputationScore = Math.max(
    0,
    Math.min(
      1,
      0.5 + (inputs.endorsementsCount * 0.1) - (inputs.flagsCount * 0.2)
    )
  );

  // Calculate base score
  const baseScore =
    inputs.coworkerAgreement * weights.coworkerAgreement +
    inputs.peerReliabilityHistory * weights.peerReliability +
    normalizedVerificationCount * weights.verificationCount +
    inputs.jobHistoryConsistency * weights.consistency +
    reputationScore * weights.reputation;

  // Convert to 0-100 scale
  const score = Math.round(baseScore * 100);

  const output: TrustScoreOutput = {
    score: Math.max(0, Math.min(100, score)),
    tier,
  };

  // Add detailed breakdown for advanced tier
  if (tier === "advanced") {
    output.breakdown = {
      coworkerAgreement: Math.round(inputs.coworkerAgreement * 100),
      peerReliability: Math.round(inputs.peerReliabilityHistory * 100),
      verificationCount: Math.round(normalizedVerificationCount * 100),
      consistency: Math.round(inputs.jobHistoryConsistency * 100),
      reputation: Math.round(reputationScore * 100),
    };
  }

  return output;
}

/**
 * Get trust score tier based on subscription
 */
export function getTrustScoreTier(subscriptionTier: string): "basic" | "advanced" {
  // Starter gets basic, Team/Pro get advanced
  return subscriptionTier === "starter" ? "basic" : "advanced";
}
