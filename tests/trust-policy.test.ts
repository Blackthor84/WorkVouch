/**
 * Trust Policy: evaluation engine and business rules.
 * - Candidate matches policy when criteria satisfied
 * - Policy rejects candidates below trust threshold
 * - Dispute detection blocks match when allow_recent_disputes is false
 */

import { describe, it, expect, beforeEach } from "vitest";
import { evaluateTrustPolicy, clearTrustPolicyCache } from "@/lib/trust/policy";
import type { SupabaseClient } from "@supabase/supabase-js";

type MockPayload = {
  policy?: Record<string, unknown> | null;
  trustScore?: { score: number } | null;
    employmentRecords?: Array<Record<string, unknown>>;
  userReferences?: { id: string }[];
  trustRelationships?: { source_profile_id: string; relationship_type: string }[];
  trustEventsDisputes?: { id: string }[];
};

/** Build a mock Supabase client that returns the given data per table. */
function createMockSupabase(overrides: MockPayload): SupabaseClient {
  const policy = overrides.policy ?? {
    id: "policy-1",
    employer_id: "emp-1",
    policy_name: "Test Policy",
    min_trust_score: 75,
    min_verification_coverage: 70,
    required_reference_type: "manager",
    min_trust_graph_depth: "moderate",
    allow_recent_disputes: false,
    created_at: new Date().toISOString(),
  };

  const payloads: Record<string, { data: unknown; error: Error | null }> = {
    trust_policies: { data: policy, error: null },
    trust_scores: {
      data: overrides.trustScore ?? { score: 80 },
      error: null,
    },
    employment_records: {
      data:
        overrides.employmentRecords ?? [
          {
            id: "er-1",
            company_name: "Acme",
            job_title: "Tech",
            start_date: "2024-01-01",
            end_date: null,
            verification_status: "verified",
          },
          {
            id: "er-2",
            company_name: "Beta",
            job_title: "Tech",
            start_date: "2023-01-01",
            end_date: "2023-12-31",
            verification_status: "verified",
          },
          {
            id: "er-3",
            company_name: "Gamma",
            job_title: "Tech",
            start_date: "2022-01-01",
            end_date: "2022-12-31",
            verification_status: "pending",
          },
        ],
      error: null,
    },
    jobs: {
      data: [],
      error: null,
    },
    user_references: {
      data: overrides.userReferences ?? [{ id: "ref-1" }],
      error: null,
    },
    trust_relationships: {
      data:
        overrides.trustRelationships ?? [
          { source_profile_id: "cand-1", relationship_type: "peer_reference" },
          { source_profile_id: "cand-1", relationship_type: "manager_confirmation" },
        ],
      error: null,
    },
    trust_events: {
      data: overrides.trustEventsDisputes ?? [],
      error: null,
    },
  };

  let currentTable: string | null = null;
  const resolve = (key: string) => {
    const p = payloads[key];
    return Promise.resolve(p ? { data: p.data, error: p.error } : { data: null, error: null });
  };
  const thenable = (key: string) => ({
    then: (fn: (r: { data: unknown; error: unknown }) => unknown) => {
      const p = payloads[key];
      return Promise.resolve(fn(p ? { data: p.data, error: p.error } : { data: null, error: null }));
    },
  });
  const chain = (table: string): Record<string, unknown> => ({
    eq: () => chain(table),
    gte: () => chain(table),
    or: () => thenable(table),
    order: () => chain(table),
    limit: () => resolve(table),
    maybeSingle: () => resolve(table),
    single: () => {
      if (table === "trust_policies" && overrides.policy === null) {
        return Promise.resolve({ data: null, error: new Error("Not found") });
      }
      return table === "trust_policies"
        ? resolve(table)
        : Promise.resolve({ data: null, error: new Error("Not found") });
    },
    then: (fn: (r: { data: unknown; error: unknown }) => unknown) =>
      thenable(table).then(fn),
  });
  const from = (table: string) => {
    currentTable = table;
    return {
      select: () => chain(table),
    };
  };
  return { from } as unknown as SupabaseClient;
}

describe("Trust Policy evaluation", () => {
  const candidateId = "cand-1";
  const policyId = "policy-1";

  beforeEach(() => {
    clearTrustPolicyCache();
  });

  it("returns match when all criteria satisfied", async () => {
    const supabase = createMockSupabase({
      policy: {
        id: policyId,
        employer_id: "e1",
        policy_name: "Strict",
        min_trust_score: 75,
        min_verification_coverage: 70,
        required_reference_type: "manager",
        min_trust_graph_depth: "moderate",
        allow_recent_disputes: false,
        created_at: new Date().toISOString(),
      },
      trustScore: { score: 80 },
      employmentRecords: [
        {
          id: "er-1",
          company_name: "Acme",
          job_title: "Tech",
          start_date: "2024-01-01",
          end_date: null,
          verification_status: "verified",
        },
        {
          id: "er-2",
          company_name: "Beta",
          job_title: "Tech",
          start_date: "2023-01-01",
          end_date: "2023-12-31",
          verification_status: "verified",
        },
      ],
      userReferences: [{ id: "r1" }],
      trustRelationships: [
        { source_profile_id: candidateId, relationship_type: "peer_reference" },
        { source_profile_id: candidateId, relationship_type: "manager_confirmation" },
      ],
      trustEventsDisputes: [],
    });
    const result = await evaluateTrustPolicy(candidateId, policyId, supabase);
    expect(result.matchScore).toBe(100);
    expect(result.matchedCriteria).toContain("trust_score");
    expect(result.matchedCriteria).toContain("verification_coverage");
    expect(result.matchedCriteria).toContain("reference_type");
    expect(result.matchedCriteria).toContain("trust_graph_depth");
    expect(result.matchedCriteria).toContain("no_recent_disputes");
    expect(result.failedCriteria).toHaveLength(0);
  });

  it("rejects candidate below trust threshold", async () => {
    const supabase = createMockSupabase({
      trustScore: { score: 60 },
      policy: {
        id: policyId,
        employer_id: "e1",
        policy_name: "High Bar",
        min_trust_score: 75,
        min_verification_coverage: 0,
        required_reference_type: null,
        min_trust_graph_depth: null,
        allow_recent_disputes: true,
        created_at: new Date().toISOString(),
      },
    });
    const result = await evaluateTrustPolicy(candidateId, policyId, supabase);
    expect(result.failedCriteria).toContain("trust_score");
    expect(result.matchedCriteria).not.toContain("trust_score");
    expect(result.matchScore).toBeLessThan(100);
  });

  it("dispute in last 180 days blocks match when allow_recent_disputes is false", async () => {
    const supabase = createMockSupabase({
      policy: {
        id: policyId,
        employer_id: "e1",
        policy_name: "No Disputes",
        min_trust_score: 0,
        min_verification_coverage: 0,
        required_reference_type: null,
        min_trust_graph_depth: null,
        allow_recent_disputes: false,
        created_at: new Date().toISOString(),
      },
      trustEventsDisputes: [{ id: "dispute-1" }],
    });
    const result = await evaluateTrustPolicy(candidateId, policyId, supabase);
    expect(result.failedCriteria).toContain("no_recent_disputes");
    expect(result.matchedCriteria).not.toContain("no_recent_disputes");
  });

  it("returns 0 match and all failed when policy not found", async () => {
    const supabase = createMockSupabase({ policy: null });
    const result = await evaluateTrustPolicy(candidateId, policyId, supabase);
    expect(result.matchScore).toBe(0);
    expect(result.matchedCriteria).toHaveLength(0);
    expect(result.failedCriteria.length).toBeGreaterThan(0);
  });
});
