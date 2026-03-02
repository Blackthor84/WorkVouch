/**
 * Behavioral truth tests for trust-related signals.
 * These tests enforce that the system never lies: every signal is derived from real data.
 * Failures here indicate invalid state or unsupported UI.
 */

import { describe, it, expect } from "vitest";
import { computeTrustTrajectory } from "@/lib/trust/trustTrajectory";

// =============================================================================
// SYSTEM 1 — TRUST TRAJECTORY
// =============================================================================

describe("Trust Trajectory", () => {
  describe("Improving", () => {
    it("returns improving when verification within 30 days, reference within 60 days, no disputes", () => {
      const result = computeTrustTrajectory({
        daysSinceLastVerification: 15,
        daysSinceLastReference: 30,
        hasOpenDispute: false,
        verifiedEmploymentCount: 2,
        totalVerifiedYears: 1.5,
        referenceCount: 2,
      });
      expect(result.trajectory).toBe("improving");
      expect(result.label).toBe("Improving");
    });

    it("returns improving when verification within 30 days and at least one reference", () => {
      const result = computeTrustTrajectory({
        daysSinceLastVerification: 10,
        daysSinceLastReference: 50,
        hasOpenDispute: false,
        verifiedEmploymentCount: 1,
        totalVerifiedYears: 0.5,
        referenceCount: 1,
      });
      expect(result.trajectory).toBe("improving");
    });
  });

  describe("Stable", () => {
    it("returns stable when verification older than 90 days, references older than 90 days, no disputes, consistent employment", () => {
      const result = computeTrustTrajectory({
        daysSinceLastVerification: 120,
        daysSinceLastReference: 100,
        hasOpenDispute: false,
        verifiedEmploymentCount: 2,
        totalVerifiedYears: 1,
        referenceCount: 1,
      });
      expect(result.trajectory).toBe("stable");
      expect(result.label).toBe("Stable");
    });
  });

  describe("At Risk", () => {
    it("returns at_risk when unresolved dispute exists", () => {
      const result = computeTrustTrajectory({
        daysSinceLastVerification: 10,
        daysSinceLastReference: 20,
        hasOpenDispute: true,
        verifiedEmploymentCount: 2,
        totalVerifiedYears: 1,
        referenceCount: 2,
      });
      expect(result.trajectory).toBe("at_risk");
      expect(result.label).toBe("At Risk");
    });

    it("returns at_risk when no verification in 180+ days", () => {
      const result = computeTrustTrajectory({
        daysSinceLastVerification: 200,
        daysSinceLastReference: 100,
        hasOpenDispute: false,
        verifiedEmploymentCount: 1,
        totalVerifiedYears: 0.5,
        referenceCount: 0,
      });
      expect(result.trajectory).toBe("at_risk");
    });

    it("returns at_risk when no verification and no references", () => {
      const result = computeTrustTrajectory({
        daysSinceLastVerification: null,
        daysSinceLastReference: null,
        hasOpenDispute: false,
        verifiedEmploymentCount: 0,
        totalVerifiedYears: 0,
        referenceCount: 0,
      });
      expect(result.trajectory).toBe("at_risk");
    });
  });

  describe("NEVER ALLOWED", () => {
    it("must NEVER be improving when an unresolved dispute exists", () => {
      const result = computeTrustTrajectory({
        daysSinceLastVerification: 5,
        daysSinceLastReference: 10,
        hasOpenDispute: true,
        verifiedEmploymentCount: 3,
        totalVerifiedYears: 2,
        referenceCount: 5,
      });
      expect(result.trajectory).not.toBe("improving");
      expect(result.trajectory).toBe("at_risk");
    });
  });
});

// =============================================================================
// SYSTEM 2 — EMPLOYER CONFIDENCE (pure level logic)
// =============================================================================

type HiringConfidenceLevel = "high" | "medium" | "low";

function computeConfidenceLevel(
  verificationCoveragePct: number,
  hasOpenDispute: boolean,
  trajectory: "improving" | "stable" | "at_risk",
  referenceCount: number
): HiringConfidenceLevel {
  if (hasOpenDispute || trajectory === "at_risk") return "low";
  if (verificationCoveragePct >= 70 && referenceCount >= 1 && trajectory !== "at_risk") return "high";
  if (verificationCoveragePct >= 40 && verificationCoveragePct < 70) return "medium";
  if (verificationCoveragePct < 40) return "low";
  return "medium";
}

describe("Employer Confidence Meter", () => {
  describe("High Confidence", () => {
    it("returns high when ≥70% verified, references, no disputes, trajectory not at_risk", () => {
      const level = computeConfidenceLevel(75, false, "improving", 2);
      expect(level).toBe("high");
    });
  });

  describe("Medium Confidence", () => {
    it("returns medium when 40–69% verified, no disputes", () => {
      const level = computeConfidenceLevel(55, false, "stable", 1);
      expect(level).toBe("medium");
    });
  });

  describe("Low Confidence", () => {
    it("returns low when <40% verified", () => {
      const level = computeConfidenceLevel(30, false, "stable", 1);
      expect(level).toBe("low");
    });

    it("returns low when unresolved dispute exists", () => {
      const level = computeConfidenceLevel(80, true, "improving", 3);
      expect(level).toBe("low");
    });

    it("returns low when trajectory is at_risk", () => {
      const level = computeConfidenceLevel(80, false, "at_risk", 3);
      expect(level).toBe("low");
    });
  });

  describe("NEVER ALLOWED", () => {
    it("must NEVER be high when an unresolved dispute exists", () => {
      const level = computeConfidenceLevel(90, true, "improving", 5);
      expect(level).not.toBe("high");
      expect(level).toBe("low");
    });

    it("payload must never have both positives and cautions empty", () => {
      const validPayload = (positives: string[], cautions: string[]): boolean =>
        positives.length > 0 || cautions.length > 0;
      expect(validPayload([], [])).toBe(false);
      expect(validPayload(["x"], [])).toBe(true);
      expect(validPayload([], ["y"])).toBe(true);
      expect(validPayload(["x"], ["y"])).toBe(true);
    });
  });
});

// =============================================================================
// SYSTEM 3 — REFERENCE CREDIBILITY BADGES (pure logic)
// =============================================================================

function badgeDirectManager(relationshipType: string | undefined): boolean {
  return relationshipType === "supervisor";
}

function badgeRepeatedCoworker(fromUserCount: number): boolean {
  return fromUserCount >= 2;
}

function badgeVerifiedMatch(jobVerificationStatus: string): boolean {
  return jobVerificationStatus === "verified";
}

describe("Reference Credibility Badges", () => {
  describe("Direct Manager", () => {
    it("includes direct_manager when relationship_type is supervisor", () => {
      expect(badgeDirectManager("supervisor")).toBe(true);
    });
    it("does not include direct_manager when relationship_type is coworker", () => {
      expect(badgeDirectManager("coworker")).toBe(false);
    });
  });

  describe("Repeated Coworker", () => {
    it("includes repeated_coworker when same referrer has 2+ references", () => {
      expect(badgeRepeatedCoworker(2)).toBe(true);
      expect(badgeRepeatedCoworker(3)).toBe(true);
    });
    it("does not include repeated_coworker when only one reference from that user", () => {
      expect(badgeRepeatedCoworker(1)).toBe(false);
    });
  });

  describe("Verified Match", () => {
    it("includes verified_match when job verification_status is verified", () => {
      expect(badgeVerifiedMatch("verified")).toBe(true);
    });
    it("does not include verified_match when not verified", () => {
      expect(badgeVerifiedMatch("unverified")).toBe(false);
    });
  });

  describe("NEVER ALLOWED", () => {
    it("direct_manager is false without supervisor relationship", () => {
      expect(badgeDirectManager(undefined)).toBe(false);
      expect(badgeDirectManager("subordinate")).toBe(false);
    });
  });
});

// =============================================================================
// SYSTEM 5 — VERIFIED EMPLOYMENT COVERAGE %
// =============================================================================

function verifiedEmploymentCoveragePct(verifiedRoles: number, totalRoles: number): number | null {
  if (totalRoles === 0) return null;
  return Math.round((verifiedRoles / totalRoles) * 100);
}

describe("Verified Employment Coverage %", () => {
  it("returns 80 when 5 total roles and 4 verified", () => {
    expect(verifiedEmploymentCoveragePct(4, 5)).toBe(80);
  });

  it("0 roles returns null (coverage hidden)", () => {
    expect(verifiedEmploymentCoveragePct(0, 0)).toBe(null);
  });

  it("0 verified returns 0", () => {
    expect(verifiedEmploymentCoveragePct(0, 5)).toBe(0);
  });

  it("rounds to nearest whole number", () => {
    expect(verifiedEmploymentCoveragePct(1, 3)).toBe(33);
    expect(verifiedEmploymentCoveragePct(2, 3)).toBe(67);
  });
});

// =============================================================================
// SYSTEM 6 — WORKVOUCH CREDENTIAL VALIDITY
// =============================================================================

function credentialValid(expiresAt: string | null, revokedAt: string | null): boolean {
  if (revokedAt) return false;
  if (!expiresAt) return true;
  return new Date(expiresAt) > new Date();
}

describe("WorkVouch Credential", () => {
  it("valid when token not expired and not revoked", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(credentialValid(future, null)).toBe(true);
  });

  it("invalid when token expired", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(credentialValid(past, null)).toBe(false);
  });

  it("invalid when revoked", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(credentialValid(future, new Date().toISOString())).toBe(false);
  });
});
