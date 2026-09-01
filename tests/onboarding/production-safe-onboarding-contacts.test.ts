import { describe, it, expect, vi, beforeEach } from "vitest";

type QueryResult = { data: unknown; error: unknown };

function createQueryBuilder(resolved: QueryResult) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.in = vi.fn(chain);
  builder.limit = vi.fn(chain);
  builder.single = vi.fn(async () => resolved);
  builder.maybeSingle = vi.fn(async () => resolved);
  Object.defineProperty(builder, "then", {
    configurable: true,
    value(resolve: (value: QueryResult) => void) {
      resolve(resolved);
    },
  });
  return builder;
}

const { mockFrom, nextSelectResult, nextDeleteResult, nextInsertResult } = vi.hoisted(() => {
  let selectResult: QueryResult = { data: [], error: null };
  let deleteResult: QueryResult = { data: null, error: null };
  let insertResult: QueryResult = { data: null, error: null };

  const mockFrom = vi.fn(() => ({
    select: vi.fn(() => createQueryBuilder(selectResult)),
    delete: vi.fn(() => {
      const builder = createQueryBuilder(deleteResult);
      builder.eq = vi.fn(() => ({
        in: vi.fn(async () => deleteResult),
      }));
      return builder;
    }),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => insertResult),
      })),
    })),
    update: vi.fn(() => createQueryBuilder({ data: null, error: null })),
  }));

  return {
    mockFrom,
    nextSelectResult: (result: QueryResult) => {
      selectResult = result;
    },
    nextDeleteResult: (result: QueryResult) => {
      deleteResult = result;
    },
    nextInsertResult: (result: QueryResult) => {
      insertResult = result;
    },
  };
});

vi.mock("@/lib/supabase-admin", () => ({
  admin: { from: mockFrom },
}));

vi.mock("@/lib/invites/inviteToken", () => ({
  generateInviteToken: vi.fn(() => "test-invite-token"),
}));

import {
  loadOnboardingContacts,
  saveOnboardingContacts,
} from "@/lib/onboarding/productionSafeOnboardingContacts";

describe("productionSafeOnboardingContacts (public.invites)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextSelectResult({ data: [], error: null });
    nextDeleteResult({ data: null, error: null });
    nextInsertResult({ data: null, error: null });
  });

  it("saves coworkers to public.invites", async () => {
    nextDeleteResult({ data: null, error: null });
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

    const result = await saveOnboardingContacts(
      "user-1",
      [{ position: 1, display_name: "Alex", email: "alex@example.com", phone: null }],
      { id: "job-1", company_name: "Acme" }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.storage).toBe("invites");
      expect(result.count).toBe(1);
    }
    expect(mockFrom).toHaveBeenCalledWith("invites");
  });

  it("loads draft invites from public.invites", async () => {
    nextSelectResult({
      data: [
        {
          id: "invite-1",
          sender_id: "user-1",
          job_id: "job-1",
          contact: "alex@example.com",
          token: "test-invite-token",
          status: "pending",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      error: null,
    });

    const result = await loadOnboardingContacts("user-1");

    expect(result.error).toBeNull();
    expect(result.contacts).toHaveLength(1);
    expect(result.contacts[0]).toMatchObject({
      position: 1,
      email: "alex@example.com",
      storage: "invites",
      coworker_invite_id: null,
    });
    expect(result.contacts[0]?.display_name).toBe("alex");
  });

  it("marks inviteSent when status is opened", async () => {
    nextSelectResult({
      data: [
        {
          id: "invite-1",
          sender_id: "user-1",
          job_id: "job-1",
          contact: "alex@example.com",
          token: "test-invite-token",
          status: "opened",
          created_at: "2026-01-01T00:00:00Z",
        },
      ],
      error: null,
    });

    const result = await loadOnboardingContacts("user-1");

    expect(result.contacts[0]?.inviteSent).toBe(true);
    expect(result.contacts[0]?.coworker_invite_id).toBe("invite-1");
  });
});
