import { describe, it, expect, vi, beforeEach } from "vitest";

const mockOrder = vi.fn();
const mockEq = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(async () => ({ id: "employer-1", email: "employer@test.com" })),
}));

import { getSavedCandidates } from "@/lib/actions/employer/saved-candidates";

describe("saved candidates (production-safe query)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it("selects production-safe profile columns only", async () => {
    const rows = await getSavedCandidates();
    expect(rows).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith("saved_candidates");
    const selectArg = String(mockSelect.mock.calls[0]?.[0] ?? "");
    expect(selectArg).toContain("full_name");
    expect(selectArg).toContain("professional_summary");
    expect(selectArg).not.toContain("profile_photo_url");
    expect(selectArg).not.toContain("trust_scores");
  });

  it("returns empty array when employer has no saved candidates", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    await expect(getSavedCandidates()).resolves.toEqual([]);
  });

  it("throws a readable error when saved_candidates table is missing", async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: {
        message:
          "Could not find the table 'public.saved_candidates' in the schema cache",
      },
    });
    await expect(getSavedCandidates()).rejects.toThrow(/Failed to fetch saved candidates/);
  });
});
