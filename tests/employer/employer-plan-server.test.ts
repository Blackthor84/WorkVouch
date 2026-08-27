import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockMaybeSingle, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockMaybeSingle, mockEq, mockSelect, mockFrom };
});

vi.mock("@/lib/supabase-admin", () => ({
  admin: { from: mockFrom },
}));

vi.mock("@/lib/employer-require-active-subscription", () => ({
  requireActiveSubscription: vi.fn(async () => ({ allowed: true })),
}));

import {
  resolveEmployerDataAccess,
  EMPLOYER_ACCESS_PROFILE_COLUMNS_FALLBACK,
} from "@/lib/employer/employerPlanServer";

describe("resolveEmployerDataAccess (production schema)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to role-only when profiles.plan column is missing", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: null,
        error: { message: "column profiles.plan does not exist", code: "42703" },
      })
      .mockResolvedValueOnce({
        data: { role: "employer" },
        error: null,
      });

    const result = await resolveEmployerDataAccess("employer-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe("free_preview");
      expect(result.plan).toBe("free");
    }
    expect(mockSelect).toHaveBeenNthCalledWith(1, "role, plan");
    expect(mockSelect).toHaveBeenNthCalledWith(2, EMPLOYER_ACCESS_PROFILE_COLUMNS_FALLBACK);
  });

  it("uses plan when profiles.plan column exists", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { role: "employer", plan: "pro" },
      error: null,
    });

    const result = await resolveEmployerDataAccess("employer-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe("full");
      expect(result.plan).toBe("pro");
    }
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledWith("role, plan");
  });

  it("getCandidateProfileForEmployer depends on resolveEmployerDataAccess before profile load", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/actions/employer/candidate-search.ts"),
      "utf8"
    );
    expect(source).toMatch(
      /resolveEmployerDataAccess[\s\S]*getCandidateProfileData/
    );
  });
});
