import { describe, it, expect, vi, beforeEach } from "vitest";

function makeResult(result: { data: unknown; error: unknown }) {
  return {
    eq: () => makeResult(result),
    then: (fn: (value: { data: unknown; error: unknown }) => unknown) =>
      Promise.resolve(fn(result)),
  };
}

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  admin: {
    from: mockFrom,
  },
}));

import { loadCandidateReferenceRatings } from "@/lib/employer/candidateReferencesSource";

describe("loadCandidateReferenceRatings (production schema)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to user_references when employment_references table is missing", async () => {
    mockFrom.mockImplementation((table: string) => ({
      select: () => ({
        eq: () => {
          if (table === "employment_references") {
            return makeResult({
              data: null,
              error: {
                code: "PGRST205",
                message: "Could not find the table 'public.employment_references' in the schema cache",
              },
            });
          }
          return makeResult({
            data: [{ rating: 5 }],
            error: null,
          });
        },
      }),
    }));

    const ratings = await loadCandidateReferenceRatings("candidate-1");

    expect(ratings).toEqual([{ rating: 5 }]);
    expect(mockFrom).toHaveBeenNthCalledWith(1, "employment_references");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "user_references");
  });

  it("returns empty array when both reference tables are missing", async () => {
    const missing = {
      code: "PGRST205",
      message: "Could not find the table in the schema cache",
    };
    mockFrom.mockImplementation(() => ({
      select: () => ({
        eq: () => makeResult({ data: null, error: missing }),
      }),
    }));

    expect(await loadCandidateReferenceRatings("candidate-1")).toEqual([]);
  });
});
