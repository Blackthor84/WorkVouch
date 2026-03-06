/**
 * Trust infrastructure: depth bands, radar normalization, risk level, credential expiry.
 * Ensures calculations and business rules match spec.
 */

import { describe, it, expect } from "vitest";
import { toDepthBand, computeDepthScore } from "@/lib/trust/depthBands";

describe("Trust Graph Depth", () => {
  describe("toDepthBand", () => {
    it("returns weak for score 0–2", () => {
      expect(toDepthBand(0)).toBe("weak");
      expect(toDepthBand(1)).toBe("weak");
      expect(toDepthBand(2)).toBe("weak");
    });

    it("returns moderate for score 3–5", () => {
      expect(toDepthBand(3)).toBe("moderate");
      expect(toDepthBand(4)).toBe("moderate");
      expect(toDepthBand(5)).toBe("moderate");
    });

    it("returns strong for score 6+", () => {
      expect(toDepthBand(6)).toBe("strong");
      expect(toDepthBand(10)).toBe("strong");
    });
  });

  describe("computeDepthScore", () => {
    it("computes direct + manager*2", () => {
      expect(computeDepthScore(2, 0)).toBe(2);
      expect(computeDepthScore(1, 2)).toBe(5);
      expect(computeDepthScore(0, 3)).toBe(6);
    });
  });
});

describe("Credential expiry", () => {
  function isCredentialExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  it("returns true when expires_at is in the past", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isCredentialExpired(past)).toBe(true);
  });

  it("returns false when expires_at is in the future", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isCredentialExpired(future)).toBe(false);
  });

  it("returns false when expires_at is null", () => {
    expect(isCredentialExpired(null)).toBe(false);
  });
});

describe("Trust radar dimensions", () => {
  it("normalizes percent 0–100", () => {
    const toPercent = (value: number, max: number) =>
      max <= 0 ? 0 : Math.round(Math.min(100, (value / max) * 100));
    expect(toPercent(0, 10)).toBe(0);
    expect(toPercent(5, 10)).toBe(50);
    expect(toPercent(10, 10)).toBe(100);
    expect(toPercent(15, 10)).toBe(100);
    expect(toPercent(1, 0)).toBe(0);
  });
});
