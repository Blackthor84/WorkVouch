import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  claimConnectCandidateInvite,
  parseConnectDirectoryCandidateId,
  sendEmployerCandidateInvite,
} from "@/lib/employer/candidates/candidate-invite-service";
import {
  CONNECT_INVITE_EXPIRY_DAYS,
  generateConnectInviteToken,
  hashConnectInviteToken,
  isConnectInviteExpired,
} from "@/lib/integrations/connect/invitations/invite-token";

const mockFrom = vi.fn();
const mockEnqueue = vi.fn();
const mockMarkSent = vi.fn();
const mockMarkFailed = vi.fn();
const mockCancel = vi.fn();
const mockLifecycleUpsert = vi.fn();
const mockAppendEvent = vi.fn();
const mockSendEmail = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  admin: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock("@/lib/integrations/connect/connect-api-runtime", () => ({
  getConnectApiRuntime: () => ({
    invitationQueue: {
      enqueue: mockEnqueue,
      markSent: mockMarkSent,
      markFailed: mockMarkFailed,
      cancel: mockCancel,
    },
    lifecycleState: { upsert: mockLifecycleUpsert },
    eventStore: { appendEvent: mockAppendEvent },
  }),
}));

vi.mock("@/lib/integrations/connect/invitations/dispatch-candidate-invite", () => ({
  dispatchConnectCandidateInviteEmail: (...args: unknown[]) => mockSendEmail(...args),
  firstNameFromFullName: (name: string) => name.split(" ")[0] ?? "there",
}));

function chain(result: unknown) {
  const promise = Promise.resolve(result);
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.gt = vi.fn(() => builder);
  builder.neq = vi.fn(() => builder);
  builder.or = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() => promise);
  builder.single = vi.fn(() => promise);
  builder.insert = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  return builder;
}

describe("connect invite token utilities", () => {
  it("generates opaque tokens without PII", () => {
    const token = generateConnectInviteToken();
    expect(token.length).toBeGreaterThan(20);
    expect(token).not.toContain("@");
  });

  it("hashes tokens for storage", () => {
    const token = "sample-token-value";
    expect(hashConnectInviteToken(token)).toBe(
      createHash("sha256").update(token).digest("hex")
    );
  });

  it("enforces expiration window", () => {
    expect(CONNECT_INVITE_EXPIRY_DAYS).toBe(14);
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isConnectInviteExpired(past)).toBe(true);
  });
});

describe("parseConnectDirectoryCandidateId", () => {
  it("accepts connect directory ids only", () => {
    expect(parseConnectDirectoryCandidateId("connect:map-1")).toBe("map-1");
    expect(parseConnectDirectoryCandidateId("wv:profile-1")).toBeNull();
  });
});

describe("sendEmployerCandidateInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnqueue.mockResolvedValue({ id: "queue-1" });
    mockMarkSent.mockResolvedValue({ id: "queue-1", status: "sent" });
    mockLifecycleUpsert.mockResolvedValue({});
    mockAppendEvent.mockResolvedValue({});
    mockSendEmail.mockResolvedValue({ success: true });
  });

  it("returns 404 for missing candidate", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_map") {
        return chain({ data: null, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await sendEmployerCandidateInvite({
      employerAccountId: "employer-a",
      employerUserId: "user-a",
      companyName: "Acme",
      directoryCandidateId: "connect:missing",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("blocks cross-employer access", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_map") {
        return chain({
          data: {
            id: "map-1",
            connection_id: "conn-1",
            external_candidate_id: "38986511009",
            external_application_id: "44213668009",
            external_job_id: null,
            workvouch_profile_id: null,
            candidate_email: "jon@example.com",
            candidate_name: "Jon Jones",
            application_status: "active",
            metadata: {},
          },
          error: null,
        });
      }
      if (table === "connect_connections") {
        return chain({
          data: {
            id: "conn-1",
            employer_account_id: "employer-b",
            provider: "greenhouse",
          },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });

    const result = await sendEmployerCandidateInvite({
      employerAccountId: "employer-a",
      employerUserId: "user-a",
      companyName: "Acme",
      directoryCandidateId: "connect:map-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(404);
  });

  it("sends invitation for own imported candidate with correct association", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_map") {
        return chain({
          data: {
            id: "map-1",
            connection_id: "conn-1",
            external_candidate_id: "38986511009",
            external_application_id: "44213668009",
            external_job_id: "job-1",
            workvouch_profile_id: null,
            candidate_email: "jon@example.com",
            candidate_name: "Jon Jones",
            application_status: "active",
            metadata: {},
          },
          error: null,
        });
      }
      if (table === "connect_connections") {
        return chain({
          data: {
            id: "conn-1",
            employer_account_id: "employer-a",
            provider: "greenhouse",
          },
          error: null,
        });
      }
      if (table === "connect_candidate_invites") {
        const builder = chain({ data: null, error: null });
        builder.insert = vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: "invite-1" }, error: null })),
          })),
        }));
        builder.update = vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        }));
        return builder;
      }
      return chain({ data: null, error: null });
    });

    const result = await sendEmployerCandidateInvite({
      employerAccountId: "employer-a",
      employerUserId: "user-a",
      companyName: "Acme Security",
      directoryCandidateId: "connect:map-1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.invitationStatus).toBe("sent");
      expect(result.platformStatus).toBe("imported_invite_sent");
      expect(result.alreadySent).toBe(false);
    }
    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId: "conn-1",
        externalCandidateId: "38986511009",
        candidateEmail: "jon@example.com",
      })
    );
    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockAppendEvent).toHaveBeenCalled();
  });

  it("is idempotent when an active invitation already exists", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_map") {
        return chain({
          data: {
            id: "map-1",
            connection_id: "conn-1",
            external_candidate_id: "38986511009",
            external_application_id: "44213668009",
            external_job_id: null,
            workvouch_profile_id: null,
            candidate_email: "jon@example.com",
            candidate_name: "Jon Jones",
            application_status: "active",
            metadata: {},
          },
          error: null,
        });
      }
      if (table === "connect_connections") {
        return chain({
          data: {
            id: "conn-1",
            employer_account_id: "employer-a",
            provider: "greenhouse",
          },
          error: null,
        });
      }
      if (table === "connect_candidate_invites") {
        return chain({
          data: {
            id: "invite-existing",
            status: "sent",
            expires_at: new Date(Date.now() + 86400000).toISOString(),
          },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });

    const result = await sendEmployerCandidateInvite({
      employerAccountId: "employer-a",
      employerUserId: "user-a",
      companyName: "Acme",
      directoryCandidateId: "connect:map-1",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadySent).toBe(true);
      expect(result.invitationId).toBe("invite-existing");
    }
    expect(mockEnqueue).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("rejects already-linked candidates", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_map") {
        return chain({
          data: {
            id: "map-1",
            connection_id: "conn-1",
            external_candidate_id: "38986511009",
            external_application_id: "44213668009",
            external_job_id: null,
            workvouch_profile_id: "profile-1",
            candidate_email: "jon@example.com",
            candidate_name: "Jon Jones",
            application_status: "active",
            metadata: {},
          },
          error: null,
        });
      }
      if (table === "connect_connections") {
        return chain({
          data: {
            id: "conn-1",
            employer_account_id: "employer-a",
            provider: "greenhouse",
          },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });

    const result = await sendEmployerCandidateInvite({
      employerAccountId: "employer-a",
      employerUserId: "user-a",
      companyName: "Acme",
      directoryCandidateId: "connect:map-1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });
});

describe("claimConnectCandidateInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLifecycleUpsert.mockResolvedValue({});
    mockAppendEvent.mockResolvedValue({});
  });

  it("rejects expired invitations", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        return chain({
          data: {
            id: "invite-1",
            status: "sent",
            expires_at: new Date(Date.now() - 60_000).toISOString(),
            connect_candidate_map_id: "map-1",
            connection_id: "conn-1",
            employer_account_id: "employer-a",
            external_candidate_id: "38986511009",
            external_application_id: "44213668009",
            external_job_id: null,
            metadata: {},
          },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });

    const result = await claimConnectCandidateInvite("token-abc", "profile-1");
    expect(result.ok).toBe(false);
  });

  it("cannot reuse a claimed invitation token for another profile", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        return chain({
          data: {
            id: "invite-1",
            status: "claimed",
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            connect_candidate_map_id: "map-1",
            claimed_profile_id: "profile-other",
          },
          error: null,
        });
      }
      if (table === "connect_candidate_map") {
        return chain({ data: { workvouch_profile_id: null }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await claimConnectCandidateInvite("token-abc", "profile-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/already claimed/i);
  });

  it("returns success idempotently for the same profile", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        return chain({
          data: {
            id: "invite-1",
            status: "claimed",
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            connect_candidate_map_id: "map-1",
            claimed_profile_id: "profile-1",
          },
          error: null,
        });
      }
      if (table === "connect_candidate_map") {
        return chain({ data: { workvouch_profile_id: "profile-1" }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await claimConnectCandidateInvite("token-abc", "profile-1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.alreadyClaimed).toBe(true);
    expect(mockAppendEvent).not.toHaveBeenCalled();
  });
});

describe("invite API route auth", () => {
  it("uses employer directory invite handler", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "app/api/employer/candidates/directory/[candidateId]/invite/route.ts"
      ),
      "utf8"
    );
    expect(source).toContain("sendEmployerCandidateInvite");
    expect(source).toContain('role !== "employer" && role !== "superadmin"');
  });
});
