/**
 * WorkVouch Intelligence Engine v1 — integrity tests.
 * Canonical scoring: score in [0, 100], rehire/sentiment/volume/tenure behavior.
 */

import { describe, it, expect } from "vitest";
import { calculateV1, calculateV1Breakdown } from "@/lib/core/intelligence";
import type { ProfileInput } from "@/lib/core/intelligence";

function input(overrides: Partial<ProfileInput> = {}): ProfileInput {
  return {
    totalMonths: 24,
    reviewCount: 5,
    sentimentAverage: 0.5,
    averageRating: 4,
    rehireEligible: true,
    fraudScore: undefined,
    ...overrides,
  };
}

describe("Intelligence Engine v1", () => {
  it("1. Long tenure, low reviews — tenure capped, volume low", () => {
    const score = calculateV1(input({ totalMonths: 600, reviewCount: 1, sentimentAverage: 0, averageRating: 3, rehireEligible: false }));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    const scoreLowTenure = calculateV1(input({ totalMonths: 12, reviewCount: 1, sentimentAverage: 0, averageRating: 3, rehireEligible: false }));
    expect(score).toBeGreaterThan(scoreLowTenure);
  });

  it("2. High reviews, short tenure — volume capped at 25", () => {
    const scoreMany = calculateV1(input({ totalMonths: 6, reviewCount: 20, sentimentAverage: 0.5, averageRating: 4, rehireEligible: true }));
    const scoreFew = calculateV1(input({ totalMonths: 6, reviewCount: 3, sentimentAverage: 0.5, averageRating: 4, rehireEligible: true }));
    expect(scoreMany).toBeGreaterThanOrEqual(0);
    expect(scoreMany).toBeLessThanOrEqual(100);
    expect(scoreMany).toBeGreaterThan(scoreFew);
  });

  it("3. Negative sentiment reduces score", () => {
    const pos = calculateV1(input({ sentimentAverage: 0.8 }));
    const neg = calculateV1(input({ sentimentAverage: -0.8 }));
    expect(neg).toBeLessThan(pos);
    expect(neg).toBeGreaterThanOrEqual(0);
    expect(pos).toBeLessThanOrEqual(100);
  });

  it("4. Mixed ratings — neutrality at 3.0", () => {
    const neutral = calculateV1(input({ averageRating: 3, sentimentAverage: 0, reviewCount: 0, totalMonths: 0 }));
    const high = calculateV1(input({ averageRating: 5, sentimentAverage: 0, reviewCount: 0, totalMonths: 0 }));
    const low = calculateV1(input({ averageRating: 1, sentimentAverage: 0, reviewCount: 0, totalMonths: 0 }));
    expect(high).toBeGreaterThan(neutral);
    expect(low).toBeLessThan(neutral);
    expect(neutral).toBeGreaterThanOrEqual(0);
    expect(neutral).toBeLessThanOrEqual(100);
  });

  it("5. Rehire false lowers score vs rehire true", () => {
    const withRehire = calculateV1(input({ rehireEligible: true }));
    const withoutRehire = calculateV1(input({ rehireEligible: false }));
    expect(withoutRehire).toBeLessThan(withRehire);
    expect(withRehire).toBeGreaterThanOrEqual(0);
    expect(withRehire).toBeLessThanOrEqual(100);
  });

  it("6. Zero reviews — score never < 0", () => {
    const score = calculateV1(input({ reviewCount: 0, totalMonths: 0, sentimentAverage: -1, averageRating: 1, rehireEligible: false }));
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("7. Extreme stress case — all inputs at extremes", () => {
    const max = calculateV1(input({ totalMonths: 1000, reviewCount: 100, sentimentAverage: 1, averageRating: 5, rehireEligible: true }));
    const min = calculateV1(input({ totalMonths: 0, reviewCount: 0, sentimentAverage: -1, averageRating: 1, rehireEligible: false }));
    expect(max).toBeLessThanOrEqual(100);
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeGreaterThan(min);
  });

  it("Score never < 0", () => {
    const score = calculateV1(input({ totalMonths: 0, reviewCount: 0, sentimentAverage: -1, averageRating: 1, rehireEligible: false }));
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("Score never > 100", () => {
    const score = calculateV1(input({ totalMonths: 9999, reviewCount: 99, sentimentAverage: 1, averageRating: 5, rehireEligible: true }));
    expect(score).toBeLessThanOrEqual(100);
  });

  it("Rehire changes score", () => {
    const a = calculateV1(input({ rehireEligible: true }));
    const b = calculateV1(input({ rehireEligible: false }));
    expect(a).not.toBe(b);
  });

  it("Positive sentiment increases score vs negative", () => {
    const pos = calculateV1(input({ sentimentAverage: 1 }));
    const neg = calculateV1(input({ sentimentAverage: -1 }));
    expect(pos).toBeGreaterThan(neg);
  });

  it("Volume has diminishing effect — cap at 25 RVS", () => {
    const s8 = calculateV1(input({ reviewCount: 8 }));
    const s20 = calculateV1(input({ reviewCount: 20 }));
    const s50 = calculateV1(input({ reviewCount: 50 }));
    expect(s20).toBeGreaterThan(s8);
    expect(s50).toBeGreaterThanOrEqual(s20);
  });

  it("Tenure capped at 30 TS", () => {
    const s12 = calculateV1(input({ totalMonths: 12, reviewCount: 0, sentimentAverage: 0, averageRating: 3, rehireEligible: false }));
    const s600 = calculateV1(input({ totalMonths: 600, reviewCount: 0, sentimentAverage: 0, averageRating: 3, rehireEligible: false }));
    const s2000 = calculateV1(input({ totalMonths: 2000, reviewCount: 0, sentimentAverage: 0, averageRating: 3, rehireEligible: false }));
    expect(s600).toBeGreaterThan(s12);
    expect(s2000).toBeLessThanOrEqual(s600 + 1);
  });

  describe("Fraud penalty (FP)", () => {
    it("High fraud lowers score", () => {
      const noFraud = calculateV1(input({ fraudScore: 0 }));
      const highFraud = calculateV1(input({ fraudScore: 1 }));
      expect(highFraud).toBeLessThan(noFraud);
      expect(noFraud).toBeGreaterThanOrEqual(0);
      expect(noFraud).toBeLessThanOrEqual(100);
      expect(highFraud).toBeGreaterThanOrEqual(0);
      expect(highFraud).toBeLessThanOrEqual(100);
    });

    it("Score never < 0 with high fraud", () => {
      const score = calculateV1(
        input({
          totalMonths: 0,
          reviewCount: 0,
          sentimentAverage: -1,
          averageRating: 1,
          rehireEligible: false,
          fraudScore: 1,
        })
      );
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("Fraud cap works — FP max 15 points", () => {
      const fpCap = calculateV1(input({ fraudScore: 1 }));
      const fpOverCap = calculateV1(input({ fraudScore: 2 }));
      expect(fpOverCap).toBe(fpCap);
    });

    it("fraud_score undefined treated as 0", () => {
      const withZero = calculateV1(input({ fraudScore: 0 }));
      const withUndefined = calculateV1(input({ fraudScore: undefined }));
      expect(withUndefined).toBe(withZero);
    });

    it("breakdown includes fraudPenalty component", () => {
      const withFraud = calculateV1Breakdown(input({ fraudScore: 0.5 }));
      const noFraud = calculateV1Breakdown(input({ fraudScore: 0 }));
      expect(withFraud.components).toHaveProperty("fraudPenalty");
      expect(typeof withFraud.components.fraudPenalty).toBe("number");
      expect(withFraud.components.fraudPenalty).toBeGreaterThanOrEqual(0);
      expect(noFraud.components.fraudPenalty).toBe(0);
      expect(withFraud.totalScore).toBeLessThanOrEqual(100);
      expect(withFraud.totalScore).toBeGreaterThanOrEqual(0);
    });

    it("fraud_count applies FR = min(fraud_count * 5, 15)", () => {
      const base = input({ totalMonths: 24, reviewCount: 5, sentimentAverage: 0.5, averageRating: 4, rehireEligible: true });
      const noFraud = calculateV1({ ...base, fraud_count: 0 });
      const oneFraud = calculateV1({ ...base, fraud_count: 1 });
      const threeFraud = calculateV1({ ...base, fraud_count: 3 });
      const fiveFraud = calculateV1({ ...base, fraud_count: 5 });
      expect(oneFraud).toBeLessThan(noFraud);
      expect(threeFraud).toBeLessThan(oneFraud);
      expect(fiveFraud).toBeLessThanOrEqual(threeFraud);
      expect(noFraud).toBeGreaterThanOrEqual(0);
      expect(noFraud).toBeLessThanOrEqual(100);
      expect(fiveFraud).toBeGreaterThanOrEqual(0);
      expect(fiveFraud).toBeLessThanOrEqual(100);
    });

    it("Score never < 0 with fraud_count", () => {
      const score = calculateV1(
        input({
          totalMonths: 0,
          reviewCount: 0,
          sentimentAverage: -1,
          averageRating: 1,
          rehireEligible: false,
          fraud_count: 10,
        })
      );
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("Score never > 100 with all max inputs", () => {
      const score = calculateV1(
        input({
          totalMonths: 9999,
          reviewCount: 99,
          sentimentAverage: 1,
          averageRating: 5,
          rehireEligible: true,
          fraud_count: 0,
        })
      );
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("Multi-location / org context (input shape only)", () => {
    it("organization_id and location_id do not affect score (optional metadata)", () => {
      const base = input({});
      const withOrg = calculateV1({ ...base, organization_id: "org-1", location_id: "loc-1" });
      const withoutOrg = calculateV1(base);
      expect(withOrg).toBe(withoutOrg);
      expect(withOrg).toBeGreaterThanOrEqual(0);
      expect(withOrg).toBeLessThanOrEqual(100);
    });

    it("prior_rehire_flags does not break score (rehireEligible drives multiplier)", () => {
      const withFlags = calculateV1(input({ prior_rehire_flags: 2 }));
      const withoutFlags = calculateV1(input({}));
      expect(withFlags).toBeGreaterThanOrEqual(0);
      expect(withFlags).toBeLessThanOrEqual(100);
      expect(withoutFlags).toBeGreaterThanOrEqual(0);
      expect(withoutFlags).toBeLessThanOrEqual(100);
    });
  });
});
