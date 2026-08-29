import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockInsert, mockSelect, mockEq } = vi.hoisted(() => {
  const mockEq = vi.fn(() => ({ eq: mockEq }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockInsert = vi.fn();
  const mockFrom = vi.fn((table: string) => {
    if (table === "trust_events") {
      return { insert: mockInsert, select: mockSelect };
    }
    return { select: mockSelect };
  });
  return { mockFrom, mockInsert, mockSelect, mockEq };
});

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseServer: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/trust/trustTrajectory", () => ({
  getTrustTrajectory: vi.fn(async () => ({
    trajectory: "stable",
    label: "Stable",
  })),
}));

import { calculateTrustScore, emitTrustEvent } from "@/lib/trust/eventEngine";

describe("eventEngine (production schema)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockEq.mockReturnValue({ eq: mockEq });
  });

  it("calculateTrustScore falls back to payload when impact_score column is missing", async () => {
    mockSelect
      .mockReturnValueOnce({
        eq: () => ({
          eq: mockEq,
          then: (fn: (value: { data: unknown; error: { code: string } }) => unknown) =>
            Promise.resolve(
              fn({
                data: null,
                error: { code: "42703", message: "column trust_events.impact_score does not exist" },
              })
            ),
        }),
      })
      .mockReturnValueOnce({
        eq: () => ({
          eq: mockEq,
          then: (fn: (value: { data: unknown; error: null }) => unknown) =>
            Promise.resolve(
              fn({
                data: [{ payload: { impact_score: 10 } }, { payload: { impact: "positive" } }],
                error: null,
              })
            ),
        }),
      });

    const result = await calculateTrustScore("profile-1");
    expect(result.score).toBeGreaterThan(50);
    expect(result.band).toBe("medium");
  });

  it("emitTrustEvent inserts payload-only row when extended columns are missing", async () => {
    mockInsert
      .mockResolvedValueOnce({
        error: { code: "42703", message: "column trust_events.impact_score does not exist" },
      })
      .mockResolvedValueOnce({ error: null });

    await emitTrustEvent({
      profile_id: "profile-1",
      event_type: "verification",
      event_source: "employment_verification",
      impact_score: 5,
      metadata: { company_name: "Acme" },
    });

    expect(mockInsert).toHaveBeenCalledTimes(2);
    expect(mockInsert.mock.calls[1][0]).toMatchObject({
      profile_id: "profile-1",
      event_type: "verification",
      payload: expect.objectContaining({
        impact_score: 5,
        company_name: "Acme",
      }),
    });
  });
});
