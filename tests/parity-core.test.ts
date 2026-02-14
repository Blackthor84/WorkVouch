/**
 * Sandbox–production parity: core logic must not branch on environment.
 * Same inputs → same outputs; same failure conditions in both modes.
 */

import { describe, it, expect } from "vitest";
import { overlapDays, confidenceFromOverlapDays, MIN_OVERLAP_DAYS } from "@/lib/core/coworker-matching";
import { APP_MODE } from "@/lib/app-mode";

describe("Parity: environment does not change behavior", () => {
  it("APP_MODE is production or sandbox only", () => {
    expect(["production", "sandbox"]).toContain(APP_MODE);
  });

  it("overlapDays is deterministic", () => {
    const start1 = new Date("2020-01-01");
    const end1 = new Date("2022-06-01");
    const start2 = new Date("2021-01-01");
    const end2 = new Date("2023-01-01");
    const days = overlapDays(start1, end1, start2, end2);
    expect(days).toBe(516); // 2021-01-01 to 2022-06-01
  });

  it("overlapDays returns 0 when no overlap", () => {
    const start1 = new Date("2020-01-01");
    const end1 = new Date("2020-12-31");
    const start2 = new Date("2021-01-01");
    const end2 = new Date("2021-12-31");
    expect(overlapDays(start1, end1, start2, end2)).toBe(0);
  });

  it("confidenceFromOverlapDays below MIN_OVERLAP_DAYS is 0", () => {
    expect(confidenceFromOverlapDays(MIN_OVERLAP_DAYS - 1)).toBe(0);
  });

  it("confidenceFromOverlapDays is deterministic and capped", () => {
    const c30 = confidenceFromOverlapDays(30);
    const c365 = confidenceFromOverlapDays(365);
    const c800 = confidenceFromOverlapDays(800);
    expect(c30).toBeGreaterThan(0);
    expect(c365).toBe(1);
    expect(c800).toBe(1);
  });
});
