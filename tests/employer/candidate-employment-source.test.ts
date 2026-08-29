import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockSelect, mockEq, mockOrder, mockLimit } = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockOrder = vi.fn(() => ({ limit: mockLimit }));
  const mockEq = vi.fn(() => ({ order: mockOrder, eq: mockEq }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockFrom, mockSelect, mockEq, mockOrder, mockLimit };
});

vi.mock("@/lib/supabase-admin", () => ({
  admin: { from: mockFrom },
}));

import {
  computeVerificationCoverage,
  loadCandidateEmploymentRows,
} from "@/lib/employer/candidateEmploymentSource";

describe("loadCandidateEmploymentRows (production schema)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockResolvedValue({ data: [], error: null });
  });

  it("falls back to jobs when employment_records table is missing", async () => {
    mockLimit
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "PGRST205",
          message: "Could not find the table 'public.employment_records' in the schema cache",
        },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: "job-1",
            company_name: "Acme",
            job_title: "Operator",
            title: null,
            start_date: "2024-01-01",
            end_date: null,
            is_current: true,
            verification_status: "verified",
          },
        ],
        error: null,
      });

    const rows = await loadCandidateEmploymentRows("candidate-1");

    expect(rows).toHaveLength(1);
    expect(rows[0].verification_status).toBe("verified");
    expect(mockFrom).toHaveBeenNthCalledWith(1, "employment_records");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "jobs");
  });

  it("computes coverage from normalized rows", () => {
    expect(
      computeVerificationCoverage([
        {
          id: "1",
          company_name: "A",
          job_title: "Tech",
          start_date: "2024-01-01",
          end_date: null,
          is_current: true,
          verification_status: "verified",
        },
        {
          id: "2",
          company_name: "B",
          job_title: "Tech",
          start_date: "2023-01-01",
          end_date: "2023-12-31",
          is_current: false,
          verification_status: "pending",
        },
      ])
    ).toEqual({
      coveragePercent: 50,
      verifiedRoles: 1,
      totalRoles: 2,
    });
  });
});
