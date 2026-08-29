import { describe, it, expect, vi, beforeEach } from "vitest";

const CANDIDATE_ID = "f05e4025-e1f1-45b4-b919-4c0c605890ce";

const { mockFrom, mockSelect, mockEq, mockOrder, mockLimit, mockOr } = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockOrder = vi.fn(() => ({ limit: mockLimit }));
  const mockOr = vi.fn(() => ({ limit: mockLimit }));
  const mockEq = vi.fn(() => ({ order: mockOrder, eq: mockEq, or: mockOr, limit: mockLimit }));
  const mockSelect = vi.fn(() => ({ eq: mockEq, or: mockOr }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockFrom, mockSelect, mockEq, mockOrder, mockLimit, mockOr };
});

vi.mock("@/lib/supabase-admin", () => ({
  admin: { from: mockFrom },
}));

import {
  EMPTY_RADAR_DIMENSIONS,
  getTrustRadarDimensions,
} from "@/lib/trust/radar";

describe("getTrustRadarDimensions (production schema)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({ data: [], error: null });
    mockOr.mockReturnValue({ limit: mockLimit });
    mockEq.mockReturnValue({ order: mockOrder, eq: mockEq, or: mockOr, limit: mockLimit });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockSelect.mockReturnValue({ eq: mockEq, or: mockOr });
  });

  it("returns dimensions when trust_events lacks payload and impact_score (production)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "employment_records") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({
                  data: null,
                  error: {
                    code: "PGRST205",
                    message:
                      "Could not find the table 'public.employment_records' in the schema cache",
                  },
                }),
              }),
            }),
          }),
        };
      }
      if (table === "jobs") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      if (table === "employment_references") {
        return {
          select: () => ({
            eq: async () => ({
              data: null,
              error: {
                code: "PGRST205",
                message:
                  "Could not find the table 'public.employment_references' in the schema cache",
              },
            }),
          }),
        };
      }
      if (table === "user_references") {
        return {
          select: () => ({
            eq: () => ({
              eq: async () => ({
                data: null,
                error: {
                  code: "PGRST205",
                  message:
                    "Could not find the table 'public.user_references' in the schema cache",
                },
              }),
            }),
          }),
        };
      }
      if (table === "trust_relationships") {
        return {
          select: () => ({
            or: async () => ({ data: [], error: null }),
          }),
        };
      }
      if (table === "compliance_disputes") {
        return {
          select: () => ({
            or: async () => ({
              data: null,
              error: {
                code: "PGRST205",
                message:
                  "Could not find the table 'public.compliance_disputes' in the schema cache",
              },
            }),
          }),
        };
      }
      if (table === "trust_events") {
        return {
          select: (columns: string) => ({
            eq: () => ({
              order: () => ({
                limit: async () => {
                  if (columns.includes("impact_score") || columns.includes("payload")) {
                    return {
                      data: null,
                      error: {
                        code: "42703",
                        message: `column trust_events.${columns.includes("payload") ? "payload" : "impact_score"} does not exist`,
                      },
                    };
                  }
                  return {
                    data: [
                      {
                        created_at: "2026-01-01T00:00:00.000Z",
                        impact: "positive",
                        metadata: {},
                        event_type: "verification",
                      },
                    ],
                    error: null,
                  };
                },
              }),
            }),
          }),
        };
      }
      return { select: mockSelect };
    });

    const supabase = { from: mockFrom } as Parameters<typeof getTrustRadarDimensions>[0];
    const dimensions = await getTrustRadarDimensions(supabase, CANDIDATE_ID);

    expect(dimensions).toEqual({
      verificationCoverage: 0,
      referenceCredibility: 0,
      networkDepth: 0,
      disputeScore: 100,
      consistencyScore: 100,
      recencyScore: 100,
    });
  });

  it("exposes an all-zero fallback payload for optional radar data", () => {
    expect(EMPTY_RADAR_DIMENSIONS).toEqual({
      verificationCoverage: 0,
      referenceCredibility: 0,
      networkDepth: 0,
      disputeScore: 0,
      consistencyScore: 0,
      recencyScore: 0,
    });
  });
});
