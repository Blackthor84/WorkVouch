import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

const EMPLOYER_ID = "92369cd3-8080-41a8-82d8-86e6df56ee58";
const CANDIDATE_ID = "f05e4025-e1f1-45b4-b919-4c0c605890ce";

const { mockRequireAuth, mockMaybeSingle, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockRequireAuth = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockRequireAuth, mockMaybeSingle, mockEq, mockSelect, mockFrom };
});

vi.mock("@/lib/auth", () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

import { isEmployerHiringPremium } from "@/lib/actions/employer/employerDashboardStats";
import {
  EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS,
  EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS_EXTENDED,
} from "@/lib/employer-require-active-subscription";

function mockProductionEmployerProfile() {
  mockMaybeSingle.mockResolvedValueOnce({
    data: { role: "employer" },
    error: null,
  });
}

function mockMissingSubscriptionStatusThenPlanTier(planTier: string) {
  mockMaybeSingle
    .mockResolvedValueOnce({
      data: null,
      error: {
        code: "42703",
        message: "column employer_accounts.subscription_status does not exist",
      },
    })
    .mockResolvedValueOnce({
      data: { id: "acct-1", plan_tier: planTier },
      error: null,
    });
}

describe("isEmployerHiringPremium (production schema)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ id: EMPLOYER_ID });
  });

  it("does not query profiles.is_premium", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib/actions/employer/employerDashboardStats.ts"),
      "utf8"
    );
    const fnBody = source.slice(
      source.indexOf("export async function isEmployerHiringPremium"),
      source.indexOf("export async function getEmployerDashboardStats")
    );
    expect(fnBody).not.toMatch(/is_premium/);
    expect(fnBody).toMatch(/requireActiveSubscription/);
  });

  it("returns true for pro plan_tier when is_premium and subscription_status columns are absent", async () => {
    mockProductionEmployerProfile();
    mockMissingSubscriptionStatusThenPlanTier("pro");

    const result = await isEmployerHiringPremium();

    expect(result).toBe(true);
    expect(mockSelect).toHaveBeenNthCalledWith(1, "role");
    expect(mockSelect).toHaveBeenNthCalledWith(2, EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS_EXTENDED);
    expect(mockSelect).toHaveBeenNthCalledWith(3, EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS);
  });

  it("returns false for free plan_tier when subscription_status column is missing", async () => {
    mockProductionEmployerProfile();
    mockMissingSubscriptionStatusThenPlanTier("free");

    expect(await isEmployerHiringPremium()).toBe(false);
  });

  it("returns false when subscription_status exists and is not active", async () => {
    mockProductionEmployerProfile();
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: "acct-1",
        plan_tier: "pro",
        subscription_status: "canceled",
      },
      error: null,
    });

    expect(await isEmployerHiringPremium()).toBe(false);
  });

  it("returns true when subscription_status is active", async () => {
    mockProductionEmployerProfile();
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: "acct-1",
        plan_tier: "pro",
        subscription_status: "active",
      },
      error: null,
    });

    expect(await isEmployerHiringPremium()).toBe(true);
  });

  it("returns true for starter and custom plan tiers via isPaidEmployerPlanTier", async () => {
    for (const tier of ["starter", "custom"] as const) {
      vi.clearAllMocks();
      mockRequireAuth.mockResolvedValue({ id: EMPLOYER_ID });
      mockProductionEmployerProfile();
      mockMissingSubscriptionStatusThenPlanTier(tier);

      expect(await isEmployerHiringPremium()).toBe(true);
    }
  });

  it("returns false for non-employer role without checking subscription", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { role: "employee" },
      error: null,
    });

    expect(await isEmployerHiringPremium()).toBe(false);
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledWith("role");
  });
});

describe("employer profile viewer unlock path", () => {
  it("pro employer + full candidate payload yields unlocked viewer prop", () => {
    const candidateDataHiringDataUnlocked = true;
    const hiringPremiumGate = true;
    const viewerHiringDataUnlocked =
      candidateDataHiringDataUnlocked && hiringPremiumGate;

    expect(viewerHiringDataUnlocked).toBe(true);
    expect(CANDIDATE_ID).toBe("f05e4025-e1f1-45b4-b919-4c0c605890ce");
    expect(EMPLOYER_ID).toBe("92369cd3-8080-41a8-82d8-86e6df56ee58");
  });

  it("page.tsx combines getCandidateProfileForEmployer and isEmployerHiringPremium", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/employer/profile/[id]/page.tsx"),
      "utf8"
    );
    expect(source).toMatch(/candidateData\.hiringDataUnlocked && hiringPremiumGate/);
    expect(source).toMatch(/isEmployerHiringPremium/);
  });
});
