import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  DIRECTORY_PROFILE_ENRICHMENT_COLUMNS,
  SAVED_CANDIDATES_DIRECTORY_PROFILE_COLUMNS,
  mergeEmployerCandidateDirectory,
  maskEmail,
  type ConnectMapRowInput,
} from "@/lib/employer/candidates/directory-service";
import { platformStatusLabel } from "@/lib/employer/candidates/status-labels";
import { getVerifiedWorkersCap } from "@/lib/employer/verifiedWorkersLimits";

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/migrations/20260825210000_connect_candidate_link_status.sql"
);

function jonJonesRow(connectionId: string): ConnectMapRowInput {
  return {
    id: "map-jon",
    connectionId,
    provider: "greenhouse",
    externalCandidateId: "38986511009",
    externalApplicationId: "44213668009",
    candidateEmail: "jon.jones@example.com",
    candidateName: "Jon Jones",
    applicationStatus: "active",
    linkStatus: "pending",
    updatedAt: "2026-08-24T00:00:00Z",
  };
}

describe("connect_candidate_map link status migration", () => {
  const sql = readFileSync(MIGRATION_PATH, "utf8");

  it("adds link and tenant columns with backfill", () => {
    expect(sql).toContain("link_status TEXT NOT NULL DEFAULT 'pending'");
    expect(sql).toContain("employer_account_id TEXT");
    expect(sql).toContain("external_application_id TEXT");
    expect(sql).toContain("external_job_id TEXT");
    expect(sql).toContain("UPDATE public.connect_candidate_map");
    expect(sql).toContain("link_status = 'auto_linked'");
  });
});

describe("mergeEmployerCandidateDirectory", () => {
  const employerAConnection = "conn-employer-a";

  it("shows imported ATS candidate as Imported · Not on WorkVouch", () => {
    const merged = mergeEmployerCandidateDirectory({
      connectRows: [jonJonesRow(employerAConnection)],
      projections: new Map([
        [
          "38986511009",
          { applicationStatus: "active", fullName: "Jon Jones" },
        ],
      ]),
      jobTitlesByExternalId: new Map(),
      profileEnrichment: new Map(),
      savedRows: [],
      filters: { source: "all" },
      maskEmails: false,
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]?.displayName).toBe("Jon Jones");
    expect(merged[0]?.source).toBe("connect");
    expect(merged[0]?.platformStatus).toBe("imported_not_on_workvouch");
    expect(platformStatusLabel(merged[0]!.platformStatus)).toBe(
      "Imported · Not on WorkVouch"
    );
    expect(merged[0]?.externalCandidateId).toBe("38986511009");
    expect(merged[0]?.externalApplicationId).toBe("44213668009");
  });

  it("scopes connect rows to the provided connection set (employer A vs B)", () => {
    const employerBConnection = "conn-employer-b";
    const employerARows = mergeEmployerCandidateDirectory({
      connectRows: [
        jonJonesRow(employerAConnection),
        jonJonesRow(employerBConnection),
      ],
      projections: new Map(),
      jobTitlesByExternalId: new Map(),
      profileEnrichment: new Map(),
      savedRows: [],
      filters: { source: "all", connectionId: employerAConnection },
      maskEmails: false,
    });

    expect(employerARows).toHaveLength(1);
    expect(employerARows[0]?.connectionId).toBe(employerAConnection);

    const employerBRows = mergeEmployerCandidateDirectory({
      connectRows: [
        jonJonesRow(employerAConnection),
        jonJonesRow(employerBConnection),
      ],
      projections: new Map(),
      jobTitlesByExternalId: new Map(),
      profileEnrichment: new Map(),
      savedRows: [],
      filters: { source: "all", connectionId: employerBConnection },
      maskEmails: false,
    });

    expect(employerBRows).toHaveLength(1);
    expect(employerBRows[0]?.connectionId).toBe(employerBConnection);
  });

  it("returns linked candidate only once when also saved", () => {
    const profileId = "profile-jane";
    const merged = mergeEmployerCandidateDirectory({
      connectRows: [
        {
          id: "map-jane",
          connectionId: employerAConnection,
          provider: "greenhouse",
          externalCandidateId: "999",
          workvouchProfileId: profileId,
          candidateName: "Jane Chen",
          linkStatus: "auto_linked",
        },
      ],
      projections: new Map(),
      jobTitlesByExternalId: new Map(),
      profileEnrichment: new Map([
        [
          profileId,
          {
            fullName: "Jane Chen",
            vouchCount: 6,
            jobTitle: "Security Guard",
            locationLabel: "NH",
          },
        ],
      ]),
      savedRows: [
        {
          candidateId: profileId,
          savedAt: "2026-08-20T00:00:00Z",
          profile: {
            fullName: "Jane Chen",
            vouchCount: 6,
            jobTitle: "Security Guard",
            locationLabel: "NH",
          },
        },
      ],
      filters: { source: "all" },
      maskEmails: false,
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]?.source).toBe("linked");
    expect(merged[0]?.directoryId).toBe("connect:map-jane");
    expect(merged[0]?.profileId).toBe(profileId);
    expect(merged[0]?.platformStatus).toBe("verified_on_workvouch");
  });

  it("includes WorkVouch-only saved candidate when not linked via Connect", () => {
    const profileId = "profile-saved-only";
    const merged = mergeEmployerCandidateDirectory({
      connectRows: [],
      projections: new Map(),
      jobTitlesByExternalId: new Map(),
      profileEnrichment: new Map([
        [
          profileId,
          {
            fullName: "Alex Rivera",
            vouchCount: 1,
            jobTitle: "Concierge",
            locationLabel: "MA",
          },
        ],
      ]),
      savedRows: [
        {
          candidateId: profileId,
          savedAt: "2026-08-21T00:00:00Z",
          profile: {
            fullName: "Alex Rivera",
            vouchCount: 1,
            jobTitle: "Concierge",
            locationLabel: "MA",
          },
        },
      ],
      filters: { source: "all" },
      maskEmails: false,
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]?.source).toBe("workvouch");
    expect(merged[0]?.platformStatus).toBe("saved_from_search");
    expect(merged[0]?.directoryId).toBe("wv:profile-saved-only");
  });

  it("excludes external_deleted connect candidates", () => {
    const merged = mergeEmployerCandidateDirectory({
      connectRows: [
        {
          ...jonJonesRow(employerAConnection),
          linkStatus: "external_deleted",
        },
      ],
      projections: new Map(),
      jobTitlesByExternalId: new Map(),
      profileEnrichment: new Map(),
      savedRows: [],
      filters: { source: "all" },
      maskEmails: false,
    });

    expect(merged).toHaveLength(0);
  });

  it("does not apply verified-workers cap to imported candidates", () => {
    const connectRows = Array.from({ length: 10 }, (_, i) => ({
      id: `map-${i}`,
      connectionId: employerAConnection,
      provider: "greenhouse",
      externalCandidateId: String(1000 + i),
      candidateName: `Imported Candidate ${i}`,
      linkStatus: "pending",
    }));

    const merged = mergeEmployerCandidateDirectory({
      connectRows,
      projections: new Map(),
      jobTitlesByExternalId: new Map(),
      profileEnrichment: new Map(),
      savedRows: [],
      filters: { source: "all" },
      maskEmails: false,
    });

    expect(merged).toHaveLength(10);
    expect(getVerifiedWorkersCap("free")).toBe(3);
    expect(merged.length).toBeGreaterThan(getVerifiedWorkersCap("free"));
  });

  it("masks email on free tier display input", () => {
    expect(maskEmail("jon.jones@example.com")).toBe("j***@example.com");

    const merged = mergeEmployerCandidateDirectory({
      connectRows: [jonJonesRow(employerAConnection)],
      projections: new Map(),
      jobTitlesByExternalId: new Map(),
      profileEnrichment: new Map(),
      savedRows: [],
      filters: { source: "all" },
      maskEmails: true,
    });

    expect(merged[0]?.emailMasked).toBe("j***@example.com");
  });
});

describe("employer candidates directory API route", () => {
  it("does not import verified-workers cap helpers for slicing", async () => {
    const source = readFileSync(
      join(process.cwd(), "app/api/employer/candidates/directory/route.ts"),
      "utf8"
    );
    expect(source).not.toContain("getVerifiedWorkersCap");
    expect(source).not.toContain("verified-workers");
    expect(source).toContain("fetchEmployerCandidateDirectory");
  });
});

describe("saved candidates production schema compatibility", () => {
  const directoryServiceSource = readFileSync(
    join(process.cwd(), "lib/employer/candidates/directory-service.ts"),
    "utf8"
  );

  it("uses production-safe saved_candidates profile embed without industry", () => {
    expect(SAVED_CANDIDATES_DIRECTORY_PROFILE_COLUMNS).toContain("full_name");
    expect(SAVED_CANDIDATES_DIRECTORY_PROFILE_COLUMNS).toContain("professional_summary");
    expect(SAVED_CANDIDATES_DIRECTORY_PROFILE_COLUMNS).not.toContain("industry");
    expect(DIRECTORY_PROFILE_ENRICHMENT_COLUMNS).not.toContain("industry");
    expect(directoryServiceSource).toContain("SAVED_CANDIDATES_DIRECTORY_PROFILE_COLUMNS");
    expect(directoryServiceSource).not.toMatch(
      /profiles:candidate_id[\s\S]*industry/
    );
  });

  it("does not throw when saved_candidates query fails (imported ATS rows still load)", () => {
    expect(directoryServiceSource).toContain("saved candidates query failed");
    expect(directoryServiceSource).toContain("return []");
    expect(directoryServiceSource).not.toContain(
      "Failed to load saved candidates"
    );
  });

  it("still merges imported ATS candidates when savedRows is empty", () => {
    const merged = mergeEmployerCandidateDirectory({
      connectRows: [jonJonesRow("conn-employer-a")],
      projections: new Map(),
      jobTitlesByExternalId: new Map(),
      profileEnrichment: new Map(),
      savedRows: [],
      filters: { source: "all" },
      maskEmails: false,
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]?.displayName).toBe("Jon Jones");
    expect(merged[0]?.platformStatus).toBe("imported_not_on_workvouch");
  });
});
