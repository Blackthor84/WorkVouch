import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockMaybeSingle, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockMaybeSingle, mockEq, mockSelect, mockFrom };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

import {
  requireActiveSubscription,
  EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS,
  EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS_EXTENDED,
  isPaidEmployerPlanTier,
} from "@/lib/employer-require-active-subscription";

describe("requireActiveSubscription (production schema)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows pro plan_tier when subscription_status column is missing", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "42703",
          message: "column employer_accounts.subscription_status does not exist",
        },
      })
      .mockResolvedValueOnce({
        data: { id: "acct-1", plan_tier: "pro" },
        error: null,
      });

    const result = await requireActiveSubscription("92369cd3-8080-41a8-82d8-86e6df56ee58");

    expect(result.allowed).toBe(true);
    expect(result.planTier).toBe("pro");
    expect(mockSelect).toHaveBeenNthCalledWith(1, EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS_EXTENDED);
    expect(mockSelect).toHaveBeenNthCalledWith(2, EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS);
  });

  it("denies free plan_tier when subscription_status column is missing", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: null,
        error: { code: "42703", message: "column employer_accounts.subscription_status does not exist" },
      })
      .mockResolvedValueOnce({
        data: { id: "acct-1", plan_tier: "free" },
        error: null,
      });

    const result = await requireActiveSubscription("employer-free");

    expect(result.allowed).toBe(false);
    expect(result.error).toBe("Active subscription required.");
  });

  it("requires active subscription_status when column exists", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: "acct-1",
        plan_tier: "pro",
        subscription_status: "canceled",
      },
      error: null,
    });

    const result = await requireActiveSubscription("employer-canceled");

    expect(result.allowed).toBe(false);
    expect(result.error).toBe("Active subscription required.");
  });

  it("allows when subscription_status is active", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        id: "acct-1",
        plan_tier: "pro",
        subscription_status: "active",
      },
      error: null,
    });

    const result = await requireActiveSubscription("employer-active");

    expect(result.allowed).toBe(true);
  });

  it("isPaidEmployerPlanTier treats pro as paid", () => {
    expect(isPaidEmployerPlanTier("pro")).toBe(true);
    expect(isPaidEmployerPlanTier("free")).toBe(false);
  });
});
