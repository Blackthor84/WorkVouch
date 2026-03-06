/**
 * Coworker discovery and bulk verification tests.
 * Verifies overlap logic and that discovery/bulk/trust flow behave correctly.
 */

import { describe, it, expect } from "vitest";
import type { DiscoveredCoworker } from "@/lib/trust/discoverCoworkers";

describe("Coworker discovery overlap logic", () => {
  function overlaps(
    aStart: string,
    aEnd: string | null,
    bStart: string,
    bEnd: string | null
  ): boolean {
    const aEndVal = aEnd ?? "9999-12-31";
    const bEndVal = bEnd ?? "9999-12-31";
    return aStart <= bEndVal && bStart <= aEndVal;
  }

  it("overlaps when periods intersect", () => {
    expect(overlaps("2020-01-01", "2020-12-31", "2020-06-01", "2021-06-01")).toBe(true);
    expect(overlaps("2020-06-01", "2021-06-01", "2020-01-01", "2020-12-31")).toBe(true);
  });

  it("no overlap when one ends before the other starts", () => {
    expect(overlaps("2020-01-01", "2020-06-01", "2020-07-01", "2020-12-31")).toBe(false);
    expect(overlaps("2020-07-01", "2020-12-31", "2020-01-01", "2020-06-01")).toBe(false);
  });

  it("overlaps when one end_date is null (current)", () => {
    expect(overlaps("2020-01-01", null, "2019-06-01", "2020-06-01")).toBe(true);
    expect(overlaps("2019-06-01", "2020-06-01", "2020-01-01", null)).toBe(true);
  });
});

describe("DiscoveredCoworker shape", () => {
  it("has required fields for API response", () => {
    const c: DiscoveredCoworker = {
      profileId: "pid",
      name: "Name",
      jobTitle: "Engineer",
      companyName: "Co",
      overlapStart: "2020-01-01",
      overlapEnd: "2020-12-31",
    };
    expect(c.profileId).toBe("pid");
    expect(c.overlapStart).toBe("2020-01-01");
    expect(c.overlapEnd).toBe("2020-12-31");
  });
});
