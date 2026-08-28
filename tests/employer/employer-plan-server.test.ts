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
  EMPLOYER_ACCOUNT_PLAN_COLUMNS,
  employerAccountTierToProfilePlan,
  employerPlanDisplayLabel,
} from "@/lib/employer/employerPlanServer";

describe("employer plan tier mapping (production source)", () => {
  it("maps employer_accounts.plan_tier pro to ProfilePlan pro", () => {
    expect(employerAccountTierToProfilePlan("pro")).toBe("pro");
    expect(employerPlanDisplayLabel("pro")).toBe("Pro Plan");
  });

  it("maps free and starter tiers to free access plan", () => {
    expect(employerAccountTierToProfilePlan("free")).toBe("free");
    expect(employerAccountTierToProfilePlan("starter")).toBe("free");
    expect(employerPlanDisplayLabel("starter")).toBe("Starter Plan");
  });

  it("employer header reads plan from employer_accounts, not hardcoded Pro Plan", () => {
    const source = readFileSync(
      join(process.cwd(), "components/employer/employer-header.tsx"),
      "utf8"
    );
    expect(source).toContain("loadEmployerAccountPlanTier");
    expect(source).toContain("employerPlanDisplayLabel");
    expect(source).not.toContain(">Pro Plan<");
  });
});

describe("resolveEmployerDataAccess (production schema)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses employer_accounts.plan_tier when profiles.plan column is missing", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: null,
        error: { message: "column profiles.plan does not exist", code: "42703" },
      })
      .mockResolvedValueOnce({
        data: { role: "employer" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { plan_tier: "pro" },
        error: null,
      });

    const result = await resolveEmployerDataAccess("employer-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe("full");
      expect(result.plan).toBe("pro");
    }
    expect(mockSelect).toHaveBeenNthCalledWith(1, "role, plan");
    expect(mockSelect).toHaveBeenNthCalledWith(2, EMPLOYER_ACCESS_PROFILE_COLUMNS_FALLBACK);
    expect(mockSelect).toHaveBeenNthCalledWith(3, EMPLOYER_ACCOUNT_PLAN_COLUMNS);
  });

  it("defaults to free_preview when profiles.plan is missing and account tier is free", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: null,
        error: { message: "column profiles.plan does not exist", code: "42703" },
      })
      .mockResolvedValueOnce({
        data: { role: "employer" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { plan_tier: "free" },
        error: null,
      });

    const result = await resolveEmployerDataAccess("employer-1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe("free_preview");
      expect(result.plan).toBe("free");
    }
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
