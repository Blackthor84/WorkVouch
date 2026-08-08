import { describe, it, expect } from "vitest";
import { calculateProfileStrength } from "@/lib/core/intelligence/engine";
import type { ProfileInput } from "@/lib/core/intelligence/types";

/**
 * Helper to generate a profile input
 */
function buildProfile(input: Partial<ProfileInput>): ProfileInput {
  return {
    totalMonths: 0,
    reviewCount: 0,
    sentimentAverage: 0,
    averageRating: 3,
    rehireEligible: true,
    ...input,
  };
}

describe("🧠 WorkVouch Intelligence Engine — Stress Tests", () => {
  /**
   * TEST GROUP A — Long-Term Loyal
   */
  it("Long tenure loyal worker scores high but not max", () => {
    const profile = buildProfile({
      totalMonths: 120,
      reviewCount: 3,
      sentimentAverage: 0.6,
      averageRating: 4.5,
      rehireEligible: true,
    });

    const score = calculateProfileStrength("v1", profile);

    expect(score).toBeGreaterThan(65);
    expect(score).toBeLessThanOrEqual(100);
  });

  /**
   * TEST GROUP B — Job Hopper Loved
   */
  it("High review volume does not overpower tenure cap", () => {
    const profile = buildProfile({
      totalMonths: 120,
      reviewCount: 10,
      sentimentAverage: 0.9,
      averageRating: 4.8,
      rehireEligible: true,
    });

    const score = calculateProfileStrength("v1", profile);

    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThan(75);
  });

  /**
   * TEST GROUP C — Long Tenure but Toxic
   */
  it("Negative sentiment + low rating significantly reduces score", () => {
    const profile = buildProfile({
      totalMonths: 96,
      reviewCount: 5,
      sentimentAverage: -0.7,
      averageRating: 2.4,
      rehireEligible: false,
    });

    const score = calculateProfileStrength("v1", profile);

    expect(score).toBeLessThan(60);
  });

  /**
   * TEST GROUP D — Gaming Attempt
   */
  it("Review volume is capped — extra reviews beyond cap do not increase score", () => {
    const atCap = buildProfile({
      totalMonths: 6,
      reviewCount: 10,
      sentimentAverage: 0.9,
      averageRating: 4.8,
      rehireEligible: true,
    });

    const overCap = buildProfile({
      totalMonths: 6,
      reviewCount: 20,
      sentimentAverage: 0.9,
      averageRating: 4.8,
      rehireEligible: true,
    });

    expect(calculateProfileStrength("v1", overCap)).toBe(calculateProfileStrength("v1", atCap));
  });

  /**
   * TEST GROUP E — Zero Reviews
   */
  it("Zero reviews still produces reasonable mid score", () => {
    const profile = buildProfile({
      totalMonths: 48,
      reviewCount: 0,
      sentimentAverage: 0,
      averageRating: 3,
      rehireEligible: true,
    });

    const score = calculateProfileStrength("v1", profile);

    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThan(75);
  });

  /**
   * Clamp Protection
   */
  it("Score never drops below 0", () => {
    const profile = buildProfile({
      totalMonths: 0,
      reviewCount: 0,
      sentimentAverage: -1,
      averageRating: 1,
      rehireEligible: false,
    });

    const score = calculateProfileStrength("v1", profile);

    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("Score never exceeds 100", () => {
    const profile = buildProfile({
      totalMonths: 500,
      reviewCount: 100,
      sentimentAverage: 1,
      averageRating: 5,
      rehireEligible: true,
    });

    const score = calculateProfileStrength("v1", profile);

    expect(score).toBeLessThanOrEqual(100);
  });

  /**
   * Sentiment Directionality
   */
  it("Positive sentiment increases score vs negative sentiment", () => {
    const positive = buildProfile({
      totalMonths: 60,
      reviewCount: 5,
      sentimentAverage: 0.8,
      averageRating: 4,
      rehireEligible: true,
    });

    const negative = buildProfile({
      totalMonths: 60,
      reviewCount: 5,
      sentimentAverage: -0.8,
      averageRating: 4,
      rehireEligible: true,
    });

    const posScore = calculateProfileStrength("v1", positive);
    const negScore = calculateProfileStrength("v1", negative);

    expect(posScore).toBeGreaterThan(negScore);
  });

  /**
   * Rehire Multiplier Effect
   */
  it("Rehire eligibility increases final score", () => {
    const rehireYes = buildProfile({
      totalMonths: 60,
      reviewCount: 5,
      sentimentAverage: 0.2,
      averageRating: 4,
      rehireEligible: true,
    });

    const rehireNo = buildProfile({
      totalMonths: 60,
      reviewCount: 5,
      sentimentAverage: 0.2,
      averageRating: 4,
      rehireEligible: false,
    });

    const yesScore = calculateProfileStrength("v1", rehireYes);
    const noScore = calculateProfileStrength("v1", rehireNo);

    expect(yesScore).toBeGreaterThan(noScore);
  });
});
