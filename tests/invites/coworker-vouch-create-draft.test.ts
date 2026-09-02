import { describe, it, expect, vi, beforeEach } from "vitest";

type QueryResult = { data: unknown; error: unknown };

const { mockFrom, nextInsertResult, mockEnsureLegacyUsersRow } = vi.hoisted(() => {
  let insertResult: QueryResult = { data: null, error: null };

  const mockFrom = vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => insertResult),
      })),
    })),
  }));

  const mockEnsureLegacyUsersRow = vi.fn(async (authUserId: string) => ({
    userId: authUserId,
    error: null,
  }));

  return {
    mockFrom,
    nextInsertResult: (result: QueryResult) => {
      insertResult = result;
    },
    mockEnsureLegacyUsersRow,
  };
});

vi.mock("@/lib/supabase-admin", () => ({
  admin: { from: mockFrom },
}));

vi.mock("@/lib/invites/ensureLegacyUsersRow", () => ({
  ensureLegacyUsersRowForAuthUser: mockEnsureLegacyUsersRow,
}));

vi.mock("@/lib/invites/inviteToken", () => ({
  generateInviteToken: vi.fn(() => "test-invite-token"),
}));

import { createDraftInvite } from "@/lib/invites/coworkerVouchInviteStore";

describe("createDraftInvite (public.invites + legacy users)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextInsertResult({ data: null, error: null });
    mockEnsureLegacyUsersRow.mockImplementation(async (authUserId: string) => ({
      userId: authUserId,
      error: null,
    }));
  });

  it("ensures legacy users row before insert and uses authUserId as sender_id", async () => {
    nextInsertResult({
      data: {
        id: "invite-1",
        sender_id: "user-1",
        job_id: "job-1",
        contact: "alex@example.com",
        token: "test-invite-token",
        status: "pending",
        created_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });

    const result = await createDraftInvite({
      senderId: "user-1",
      jobId: "job-1",
      email: "alex@example.com",
    });

    expect(mockEnsureLegacyUsersRow).toHaveBeenCalledWith("user-1");
    expect(result.error).toBeNull();
    expect(result.invite?.sender_id).toBe("user-1");
    expect(result.invite?.status).toBe("pending");
    expect(mockFrom).toHaveBeenCalledWith("invites");
  });

  it("does not insert invites when legacy users sync fails", async () => {
    mockEnsureLegacyUsersRow.mockResolvedValueOnce({
      userId: "user-1",
      error: { message: "users upsert failed" },
    });

    const result = await createDraftInvite({
      senderId: "user-1",
      jobId: "job-1",
      email: "alex@example.com",
    });

    expect(result.invite).toBeNull();
    expect(result.error).toEqual({ message: "users upsert failed" });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("creates pending status only (no sent/draft)", async () => {
    const insertSpy = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: {
            id: "invite-1",
            sender_id: "user-1",
            job_id: "job-1",
            contact: "alex@example.com",
            token: "test-invite-token",
            status: "pending",
            created_at: "2026-01-01T00:00:00Z",
          },
          error: null,
        })),
      })),
    }));
    mockFrom.mockReturnValueOnce({ insert: insertSpy });

    await createDraftInvite({
      senderId: "user-1",
      jobId: "job-1",
      email: "alex@example.com",
    });

    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sender_id: "user-1",
        status: "pending",
      })
    );
    expect(insertSpy.mock.calls[0]?.[0]).not.toHaveProperty("status", "sent");
    expect(insertSpy.mock.calls[0]?.[0]).not.toHaveProperty("status", "draft");
  });
});
