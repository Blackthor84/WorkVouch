import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle, maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ from: mockFrom })),
}));

vi.mock("@/lib/auth/getUser", () => ({
  getUser: vi.fn(async () => ({ id: "user-1", email: "employer@test.com" })),
}));

vi.mock("@/lib/server/effectiveUserId", () => ({
  getEffectiveUserIdWithAuth: vi.fn(async () => ({
    effectiveUserId: "user-1",
    authUserId: "user-1",
    isImpersonating: false,
  })),
  getEffectiveUserId: vi.fn(async () => "user-1"),
}));

vi.mock("@/lib/auth/getAuthedUser", () => ({
  getAuthedUser: vi.fn(async () => ({
    user: { id: "user-1", email: "employer@test.com" },
    role: "user" as const,
  })),
}));

vi.mock("@/lib/impersonation/scenarioResolver", () => ({
  applyScenario: (data: unknown) => data,
}));

import { hasRole, getCurrentUser } from "@/lib/auth";

describe("employer profile auth (production schema)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: {
        id: "user-1",
        full_name: "Test Employer",
        email: "employer@test.com",
        role: "employer",
        state: "NH",
        professional_summary: null,
        created_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "user-1",
        email: "employer@test.com",
        full_name: "Test Employer",
        role: "employer",
      },
      error: null,
    });
  });

  it("hasRole(employer) uses production-safe profile columns", async () => {
    await expect(hasRole("employer")).resolves.toBe(true);
    expect(mockSelect).toHaveBeenCalledWith(
      "id, full_name, email, role, state, professional_summary, created_at"
    );
    expect(mockSelect.mock.calls.some((c) => String(c[0]).includes("user_id"))).toBe(false);
    expect(mockSelect.mock.calls.some((c) => String(c[0]).includes("profile_photo_url"))).toBe(
      false
    );
  });

  it("getCurrentUser resolves when profile row exists", async () => {
    const user = await getCurrentUser();
    expect(user?.id).toBe("user-1");
    expect(user?.email).toBe("employer@test.com");
  });
});
