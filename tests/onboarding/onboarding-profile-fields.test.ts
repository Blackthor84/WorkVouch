import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockUpdate, mockEq, mockSelect, mockMaybeSingle, mockUpsert } = vi.hoisted(() => {
  const mockEq = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, eq: mockEq });
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));
  const mockUpsert = vi.fn();
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    update: mockUpdate,
    upsert: mockUpsert,
  }));
  return { mockFrom, mockUpdate, mockEq, mockSelect, mockMaybeSingle, mockUpsert };
});

vi.mock("@/lib/supabase-admin", () => ({
  admin: { from: mockFrom },
}));

import {
  loadOnboardingProfileFields,
  saveOnboardingProfileFields,
} from "@/lib/onboarding/onboardingProfileFields";

describe("onboardingProfileFields (production schema)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle, eq: mockEq });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("loads profile fields without profiles.industry in production", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "42703",
          message: "column profiles.industry does not exist",
        },
      })
      .mockResolvedValueOnce({
        data: { created_at: "2026-01-01T00:00:00.000Z", professional_summary: "Summary" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "PGRST205",
          message: "Could not find the table 'public.employee_profiles' in the schema cache",
        },
      });

    const fields = await loadOnboardingProfileFields("user-1");

    expect(fields).toEqual({
      industry: null,
      professionalSummary: "Summary",
      verticalMetadata: {},
      workerOnboardingLoopCompletedAt: null,
      vouchCount: 0,
      vouchTier: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("saves industry without failing when profiles.industry is absent", async () => {
    mockEq.mockImplementation(() => ({
      maybeSingle: mockMaybeSingle,
      eq: mockEq,
    }));

    mockUpdate.mockImplementation(() => ({
      eq: vi.fn(async () => ({
        error: {
          code: "42703",
          message: "column profiles.industry does not exist",
        },
      })),
    }));

    mockUpsert.mockResolvedValueOnce({
      error: {
        code: "PGRST205",
        message: "Could not find the table 'public.employee_profiles' in the schema cache",
      },
    });

    const result = await saveOnboardingProfileFields("user-1", {
      industry: "Healthcare",
    });

    expect(result).toEqual({
      ok: true,
      persisted: {
        industry: false,
        professional_summary: false,
        vertical_metadata: false,
      },
      industry: "Healthcare",
    });
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockFrom).toHaveBeenCalledWith("employee_profiles");
  });

  it("persists industry on profiles when the column exists", async () => {
    mockUpdate.mockImplementation(() => ({
      eq: vi.fn(async () => ({ error: null })),
    }));

    const result = await saveOnboardingProfileFields("user-1", {
      industry: "Healthcare",
    });

    expect(result.persisted.industry).toBe(true);
    expect(result.industry).toBe("Healthcare");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ industry: "Healthcare" })
    );
  });

  it("persists professional_summary when profiles.industry is absent", async () => {
    let call = 0;
    mockUpdate.mockImplementation(() => ({
      eq: vi.fn(async () => {
        call += 1;
        if (call === 1) {
          return {
            error: {
              code: "42703",
              message: "column profiles.industry does not exist",
            },
          };
        }
        if (call === 2) {
          return {
            error: {
              code: "42703",
              message: "column profiles.vertical_metadata does not exist",
            },
          };
        }
        return { error: null };
      }),
    }));

    mockUpsert.mockResolvedValueOnce({
      error: {
        code: "PGRST205",
        message: "Could not find the table 'public.employee_profiles' in the schema cache",
      },
    });

    const result = await saveOnboardingProfileFields("user-1", {
      industry: "Healthcare",
      professional_summary: "Experienced operator",
    });

    expect(result.persisted.professional_summary).toBe(true);
    expect(result.persisted.industry).toBe(false);
    expect(result.industry).toBe("Healthcare");
  });
});
