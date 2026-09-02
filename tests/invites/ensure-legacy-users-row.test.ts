import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockUpsert, mockProfileMaybeSingle } = vi.hoisted(() => {
  const mockProfileMaybeSingle = vi.fn();
  const mockUpsert = vi.fn();
  const mockFrom = vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle: mockProfileMaybeSingle })),
        })),
      };
    }
    if (table === "users") {
      return { upsert: mockUpsert };
    }
    return {};
  });
  return { mockFrom, mockUpsert, mockProfileMaybeSingle };
});

vi.mock("@/lib/supabase-admin", () => ({
  admin: { from: mockFrom },
}));

import { ensureLegacyUsersRowForAuthUser } from "@/lib/invites/ensureLegacyUsersRow";

const AUTH_ID = "92369cd3-8080-41a8-82d8-86e6df56ee58";

describe("ensureLegacyUsersRowForAuthUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("creates public.users row from profile and returns authUserId", async () => {
    mockProfileMaybeSingle.mockResolvedValue({
      data: {
        id: AUTH_ID,
        email: "founder@example.com",
        full_name: "Cassie Steve",
        role: "employer",
      },
      error: null,
    });

    const result = await ensureLegacyUsersRowForAuthUser(AUTH_ID);

    expect(result.error).toBeNull();
    expect(result.userId).toBe(AUTH_ID);
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        id: AUTH_ID,
        email: "founder@example.com",
        name: "Cassie Steve",
        full_name: "Cassie Steve",
        role: "employer",
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
  });

  it("is idempotent when public.users row already exists", async () => {
    mockProfileMaybeSingle.mockResolvedValue({
      data: {
        id: AUTH_ID,
        email: "founder@example.com",
        full_name: "Cassie Steve",
        role: "employer",
      },
      error: null,
    });

    await ensureLegacyUsersRowForAuthUser(AUTH_ID);
    await ensureLegacyUsersRowForAuthUser(AUTH_ID);

    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: AUTH_ID }),
      { onConflict: "id", ignoreDuplicates: true }
    );
    expect(mockUpsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: AUTH_ID }),
      { onConflict: "id", ignoreDuplicates: true }
    );
  });

  it("omits created_at and uses only confirmed legacy columns", async () => {
    mockProfileMaybeSingle.mockResolvedValue({
      data: { id: AUTH_ID, email: "a@b.com", full_name: "Alex", role: null },
      error: null,
    });

    await ensureLegacyUsersRowForAuthUser(AUTH_ID);

    const payload = mockUpsert.mock.calls[0]?.[0] as Record<string, string>;
    expect(Object.keys(payload).sort()).toEqual(["email", "full_name", "id", "name"].sort());
    expect(payload).not.toHaveProperty("created_at");
    expect(payload).not.toHaveProperty("role");
  });

  it("falls back to options.email when profile is missing", async () => {
    mockProfileMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await ensureLegacyUsersRowForAuthUser(AUTH_ID, {
      email: "session@example.com",
    });

    expect(result.userId).toBe(AUTH_ID);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: AUTH_ID,
        email: "session@example.com",
        name: "session",
        full_name: "session",
      }),
      { onConflict: "id", ignoreDuplicates: true }
    );
  });

  it("returns profile load error without upserting users", async () => {
    mockProfileMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "profile read failed" },
    });

    const result = await ensureLegacyUsersRowForAuthUser(AUTH_ID);

    expect(result.error).toEqual({ message: "profile read failed" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
