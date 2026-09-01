import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFrom, mockSelect, mockEq, mockOrder, mockLimit, mockMaybeSingle, mockDelete, mockInsert, mockUpdate, mockSingle, mockIs } =
  vi.hoisted(() => {
    const mockSingle = vi.fn();
    const mockMaybeSingle = vi.fn();
    const mockIs = vi.fn();
    const mockLimit = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
    const mockOrder = vi.fn(() => ({ limit: mockLimit, order: mockOrder }));
    const mockEq = vi.fn(() => ({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      maybeSingle: mockMaybeSingle,
      select: mockSelect,
      delete: mockDelete,
      insert: mockInsert,
      update: mockUpdate,
      is: mockIs,
    }));
    const mockSelect = vi.fn(() => ({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
    }));
    const mockDelete = vi.fn(() => ({ eq: mockEq }));
    const mockInsert = vi.fn(() => ({ select: mockSelect }));
    const mockUpdate = vi.fn(() => ({ eq: mockEq }));
    const mockFrom = vi.fn(() => ({
      select: mockSelect,
      delete: mockDelete,
      insert: mockInsert,
      update: mockUpdate,
    }));
    return {
      mockFrom,
      mockSelect,
      mockEq,
      mockOrder,
      mockLimit,
      mockMaybeSingle,
      mockDelete,
      mockInsert,
      mockUpdate,
      mockSingle,
      mockIs,
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

describe("productionSafeOnboardingContacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      maybeSingle: mockMaybeSingle,
      select: mockSelect,
      delete: mockDelete,
      insert: mockInsert,
      update: mockUpdate,
      is: mockIs,
    });
    mockOrder.mockReturnValue({ limit: mockLimit, order: mockOrder });
    mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
    });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockIs.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({
      select: mockSelect,
      delete: mockDelete,
      insert: mockInsert,
      update: mockUpdate,
    });
  });

  function mockMissingWorkerContactsTable() {
    mockFrom.mockImplementation((table: string) => {
      if (table === "worker_onboarding_contacts") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
            limit: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: {
                  code: "PGRST205",
                  message:
                    "Could not find the table 'public.worker_onboarding_contacts' in the schema cache",
                },
              }),
            })),
          })),
          delete: mockDelete,
          insert: mockInsert,
          update: mockUpdate,
        };
      }
      return {
        select: mockSelect,
        delete: mockDelete,
        insert: mockInsert,
        update: mockUpdate,
      };
    });
  }

  it("saves coworkers to worker_onboarding_contacts when table exists", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "worker_onboarding_contacts") {
        return {
          select: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: mockUpdate,
        };
      }
      return {
        select: mockSelect,
        delete: mockDelete,
        insert: mockInsert,
        update: mockUpdate,
      };
    });

    const result = await saveOnboardingContacts(
      "user-1",
      [{ position: 1, display_name: "Alex", email: "alex@example.com", phone: null }],
      { id: "job-1", company_name: "Acme" }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.storage).toBe("worker_onboarding_contacts");
      expect(result.count).toBe(1);
    }
    expect(mockFrom).toHaveBeenCalledWith("worker_onboarding_contacts");
  });

  it("falls back to coworker_invites when worker_onboarding_contacts is missing", async () => {
    mockMissingWorkerContactsTable();

    mockDelete.mockReturnValueOnce({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    });

    mockInsert.mockImplementationOnce(() => ({
      select: () => ({
        single: vi.fn().mockResolvedValue({
          data: { id: "invite-1", invite_token: "test-invite-token" },
          error: null,
        }),
      }),
    }));

    const result = await saveOnboardingContacts(
      "user-1",
      [{ position: 1, display_name: "Alex", email: "alex@example.com", phone: null }],
      { id: "job-1", company_name: "Acme" }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.storage).toBe("coworker_invites");
      expect(result.count).toBe(1);
    }
    expect(mockFrom).toHaveBeenCalledWith("coworker_invites");
  });

  it("loads draft coworker_invites when worker_onboarding_contacts is missing", async () => {
    mockMissingWorkerContactsTable();

    mockOrder.mockReturnValueOnce({
      data: [
        {
          id: "invite-1",
          email: "alex@example.com",
          phone: null,
          invite_sent_at: null,
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
      storage: "coworker_invites",
      coworker_invite_id: null,
    });
  });

  it("returns a clear error for phone-only contacts when email is required", async () => {
    mockMissingWorkerContactsTable();

    mockDelete.mockReturnValueOnce({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    });

    mockInsert.mockImplementationOnce(() => ({
      select: () => ({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: "23502",
            message: 'null value in column "email" of relation "coworker_invites" violates not-null constraint',
          },
        }),
      }),
    }));

    const result = await saveOnboardingContacts(
      "user-1",
      [{ position: 1, display_name: "Alex", email: null, phone: "+15551234567" }],
      { id: "job-1", company_name: "Acme" }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("email address");
    }
  });
});
