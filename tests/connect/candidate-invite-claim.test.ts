import { createHash } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { claimConnectCandidateInvite } from "@/lib/employer/candidates/candidate-invite-service";
import {
  inviteEmailsMatch,
  maskEmailForInviteDisplay,
  resolveConnectCandidateInvitePreview,
  sanitizeConnectInviteToken,
} from "@/lib/integrations/connect/invitations/resolve-connect-invite";
import { hashConnectInviteToken } from "@/lib/integrations/connect/invitations/invite-token";
import { isSafeConnectInviteReturnTo } from "@/lib/auth/safeReturnTo";

const mockFrom = vi.fn();
const mockLifecycleUpsert = vi.fn();
const mockAppendEvent = vi.fn();

vi.mock("@/lib/supabase-admin", () => ({
  admin: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock("@/lib/integrations/connect/connect-api-runtime", () => ({
  getConnectApiRuntime: () => ({
    lifecycleState: { upsert: mockLifecycleUpsert },
    eventStore: { appendEvent: mockAppendEvent },
  }),
}));

function chain(result: unknown) {
  const promise = Promise.resolve(result);
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.gt = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() => promise);
  builder.single = vi.fn(() => promise);
  builder.insert = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  return builder;
}

const RAW_TOKEN = "sample-connect-invite-token";
const TOKEN_HASH = hashConnectInviteToken(RAW_TOKEN);

function baseInvite(overrides: Record<string, unknown> = {}) {
  return {
    id: "invite-1",
    status: "sent",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    candidate_email: "jon@example.com",
    connect_candidate_map_id: "map-1",
    employer_account_id: "employer-a",
    connection_id: "conn-1",
    external_candidate_id: "38986511009",
    external_application_id: "44213668009",
    external_job_id: null,
    claimed_profile_id: null,
    metadata: { correlation_id: "corr-1" },
    ...overrides,
  };
}

describe("sanitizeConnectInviteToken", () => {
  it("accepts opaque base64url tokens", () => {
    expect(sanitizeConnectInviteToken(RAW_TOKEN)).toBe(RAW_TOKEN);
  });

  it("rejects empty and malformed tokens", () => {
    expect(sanitizeConnectInviteToken("")).toBeNull();
    expect(sanitizeConnectInviteToken("bad token!")).toBeNull();
  });
});

describe("isSafeConnectInviteReturnTo", () => {
  it("allows connect invite return paths with valid tokens", () => {
    expect(isSafeConnectInviteReturnTo(`/connect/invite/${RAW_TOKEN}`)).toBe(true);
  });

  it("rejects unsafe return paths", () => {
    expect(isSafeConnectInviteReturnTo("/dashboard")).toBe(false);
    expect(isSafeConnectInviteReturnTo("/connect/invite/bad token")).toBe(false);
    expect(isSafeConnectInviteReturnTo("//evil.com/connect/invite/x")).toBe(false);
  });
});

describe("resolveConnectCandidateInvitePreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads a valid eligible invitation without exposing token_hash", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        return chain({ data: baseInvite(), error: null });
      }
      if (table === "employer_accounts") {
        return chain({ data: { company_name: "Acme Security" }, error: null });
      }
      if (table === "connect_candidate_map") {
        return chain({ data: { candidate_name: "Jon Jones", workvouch_profile_id: null }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const preview = await resolveConnectCandidateInvitePreview(RAW_TOKEN);
    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.state).toBe("eligible");
      expect(preview.candidateName).toBe("Jon Jones");
      expect(preview.employerCompanyName).toBe("Acme Security");
      expect(preview.maskedEmail).toBe(maskEmailForInviteDisplay("jon@example.com"));
    }
    expect(JSON.stringify(preview)).not.toContain(TOKEN_HASH);
  });

  it("rejects invalid tokens", async () => {
    mockFrom.mockImplementation(() => chain({ data: null, error: null }));
    const preview = await resolveConnectCandidateInvitePreview("!!!");
    expect(preview).toEqual({ ok: false, state: "invalid" });
  });

  it("rejects expired invitations", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        const builder = chain({
          data: baseInvite({
            expires_at: new Date(Date.now() - 60_000).toISOString(),
          }),
          error: null,
        });
        builder.update = vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        }));
        return builder;
      }
      return chain({ data: null, error: null });
    });

    const preview = await resolveConnectCandidateInvitePreview(RAW_TOKEN);
    expect(preview).toEqual({ ok: false, state: "expired" });
  });

  it("handles already claimed invitation for current user", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        return chain({
          data: baseInvite({ status: "claimed", claimed_profile_id: "profile-1" }),
          error: null,
        });
      }
      if (table === "employer_accounts") {
        return chain({ data: { company_name: "Acme Security" }, error: null });
      }
      if (table === "connect_candidate_map") {
        return chain({
          data: { candidate_name: "Jon Jones", workvouch_profile_id: "profile-1" },
          error: null,
        });
      }
      return chain({ data: null, error: null });
    });

    const preview = await resolveConnectCandidateInvitePreview(RAW_TOKEN, {
      profileId: "profile-1",
    });
    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.state).toBe("claimed");
      expect(preview.claimedByCurrentUser).toBe(true);
    }
  });
});

describe("inviteEmailsMatch", () => {
  it("matches invitation email to authenticated user", () => {
    expect(inviteEmailsMatch("Jon@Example.com", "jon@example.com")).toBe(true);
    expect(inviteEmailsMatch("jon@example.com", "other@example.com")).toBe(false);
  });
});

describe("claimConnectCandidateInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLifecycleUpsert.mockResolvedValue({});
    mockAppendEvent.mockResolvedValue({});
  });

  it("allows authenticated candidate to claim a valid invitation", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        const builder = chain({ data: baseInvite(), error: null });
        builder.update = vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        }));
        return builder;
      }
      if (table === "connect_candidate_map") {
        const builder = chain({ data: { workvouch_profile_id: null }, error: null });
        builder.update = vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        }));
        return builder;
      }
      return chain({ data: null, error: null });
    });

    const result = await claimConnectCandidateInvite(RAW_TOKEN, "profile-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.profileId).toBe("profile-1");
      expect(result.connectCandidateMapId).toBe("map-1");
    }
    expect(mockLifecycleUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ state: "account_created", lastEventType: "workflow.invitation.accepted" })
    );
    expect(mockAppendEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "workflow.invitation.accepted" })
    );
  });

  it("associates workvouch_profile_id and updates candidate map", async () => {
    const mapUpdates: unknown[] = [];
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        const builder = chain({ data: baseInvite(), error: null });
        builder.update = vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        }));
        return builder;
      }
      if (table === "connect_candidate_map") {
        const builder = chain({ data: { workvouch_profile_id: null }, error: null });
        builder.update = vi.fn((payload: unknown) => {
          mapUpdates.push(payload);
          return {
            eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
          };
        });
        return builder;
      }
      return chain({ data: null, error: null });
    });

    await claimConnectCandidateInvite(RAW_TOKEN, "profile-1");
    expect(mapUpdates[0]).toEqual(
      expect.objectContaining({
        workvouch_profile_id: "profile-1",
        link_status: "manual_linked",
        link_method: "invite_claim",
      })
    );
  });

  it("rejects expired invitations", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        const builder = chain({
          data: baseInvite({
            expires_at: new Date(Date.now() - 60_000).toISOString(),
          }),
          error: null,
        });
        builder.update = vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        }));
        return builder;
      }
      if (table === "connect_candidate_map") {
        return chain({ data: { workvouch_profile_id: null }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await claimConnectCandidateInvite(RAW_TOKEN, "profile-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("expired");
  });

  it("rejects claimed invitation tokens for a different profile", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        return chain({
          data: baseInvite({ status: "claimed", claimed_profile_id: "profile-other" }),
          error: null,
        });
      }
      if (table === "connect_candidate_map") {
        return chain({ data: { workvouch_profile_id: null }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await claimConnectCandidateInvite(RAW_TOKEN, "profile-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("already_claimed");
  });

  it("is idempotent when the same profile revisits claim", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        return chain({
          data: baseInvite({ status: "claimed", claimed_profile_id: "profile-1" }),
          error: null,
        });
      }
      if (table === "connect_candidate_map") {
        return chain({ data: { workvouch_profile_id: "profile-1" }, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await claimConnectCandidateInvite(RAW_TOKEN, "profile-1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.alreadyClaimed).toBe(true);
    expect(mockAppendEvent).not.toHaveBeenCalled();
    expect(mockLifecycleUpsert).not.toHaveBeenCalled();
  });

  it("rejects invalid token hash lookups", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "connect_candidate_invites") {
        return chain({ data: null, error: null });
      }
      return chain({ data: null, error: null });
    });

    const result = await claimConnectCandidateInvite("missing-token", "profile-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("not_found");
  });

  it("hashes raw token consistently with Phase 2A utility", () => {
    expect(hashConnectInviteToken(RAW_TOKEN)).toBe(
      createHash("sha256").update(RAW_TOKEN).digest("hex")
    );
  });
});

describe("connect invite claim page wiring", () => {
  it("uses server-side preview and claim helpers", async () => {
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const source = readFileSync(
      join(process.cwd(), "app/connect/invite/[token]/page.tsx"),
      "utf8"
    );
    expect(source).toContain("resolveConnectCandidateInvitePreview");
    expect(source).toContain("claimConnectCandidateInvite");
    expect(source).not.toContain("token_hash");
  });

  it("exposes authenticated claim API route", async () => {
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const source = readFileSync(
      join(process.cwd(), "app/api/connect/invite/claim/route.ts"),
      "utf8"
    );
    expect(source).toContain("claimConnectCandidateInvite");
    expect(source).toContain("inviteEmailsMatch");
  });
});
