import { describe, it, expect } from "vitest";
import {
  buildTrustExplanation,
  buildTrustBadges,
} from "@/lib/trust/trustExplanation";
import type { TrustScoreComponents } from "@/lib/trustScore";

const baseComponents: TrustScoreComponents = {
  verifiedEmployments: 0,
  totalVerifiedYears: 0,
  averageReferenceRating: 0,
  referenceCount: 0,
  uniqueEmployersWithReferences: 0,
  fraudFlagsCount: 0,
};

describe("Trust Engine — explanation", () => {
  it("includes verified employment and references when present", () => {
    const lines = buildTrustExplanation(86, {
      ...baseComponents,
      verifiedEmployments: 2,
      referenceCount: 8,
      averageReferenceRating: 4.5,
      totalVerifiedYears: 4,
      uniqueEmployersWithReferences: 2,
    });
    const text = lines.map((l) => l.text).join(" ");
    expect(text).toMatch(/2 verified employment/);
    expect(text).toMatch(/8 coworker verification/);
    expect(text).toMatch(/4\+ years/);
    expect(text).toMatch(/multiple employers/i);
  });

  it("flags disputes as negative", () => {
    const lines = buildTrustExplanation(40, {
      ...baseComponents,
      fraudFlagsCount: 1,
    });
    expect(lines.some((l) => l.kind === "negative" && l.text.includes("dispute"))).toBe(true);
  });
});

describe("Trust Engine — badges", () => {
  it("awards complete profile badge when criteria met", () => {
    const badges = buildTrustBadges({
      ...baseComponents,
      verifiedEmployments: 1,
      referenceCount: 2,
      totalVerifiedYears: 1,
    });
    expect(badges.some((b) => b.id === "complete_profile")).toBe(true);
    expect(badges.some((b) => b.id === "verified_employment")).toBe(true);
  });

  it("awards long-term badge at 3+ years", () => {
    const badges = buildTrustBadges({
      ...baseComponents,
      totalVerifiedYears: 3.5,
      verifiedEmployments: 1,
    });
    expect(badges.some((b) => b.id === "long_term")).toBe(true);
  });
});
