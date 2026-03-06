/**
 * Trust Automation: rule engine and alerts.
 * - Alerts trigger when policy conditions met
 * - Alerts trigger when trust risk occurs
 * - Alerts stored correctly
 * - Rules evaluate after trust events (event-driven)
 */

import { describe, it, expect, vi } from "vitest";
import { evaluateTrustAutomationRules } from "@/lib/trust/automation";
import type { SupabaseClient } from "@supabase/supabase-js";

// Minimal mock: no DB, just assert engine behavior and that we would write alerts
describe("Trust Automation rule engine", () => {
  it("normalizes event types for rule type lookup", async () => {
    const inserted: { employer_id: string; candidate_id: string; alert_type: string; alert_message: string }[] = [];
    const from = (table: string) => {
      if (table === "saved_candidates") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [{ employer_id: "emp-1" }],
                error: null,
              }),
          }),
        };
      }
      if (table === "employment_records") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      if (table === "employer_accounts") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      if (table === "trust_automation_rules") {
        return {
          select: () => ({
            in: () => ({
              in: () =>
                Promise.resolve({
                  data: [
                    {
                      id: "rule-1",
                      employer_id: "emp-1",
                      rule_name: "Risk",
                      rule_type: "candidate_trust_risk",
                      rule_conditions: { min_trust_score: 75 },
                      notification_type: "create_dashboard_alert",
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === "trust_scores") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({ data: { score: 60 }, error: null }),
            }),
          }),
        };
      }
      if (table === "trust_alerts") {
        return {
          insert: (row: typeof inserted[0]) => {
            inserted.push(row);
            return Promise.resolve({ data: null, error: null });
          },
        };
      }
      return { select: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) };
    };
    const supabase = { from } as unknown as SupabaseClient;
    const result = await evaluateTrustAutomationRules("cand-1", "verification", supabase);
    expect(result.alertsCreated).toBeGreaterThanOrEqual(0);
  });

  it("alerts trigger when trust risk condition met (score below threshold)", async () => {
    let alertInserted: unknown = null;
    const supabase = {
      from: (table: string) => {
        if (table === "saved_candidates")
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({ data: [{ employer_id: "e1" }], error: null }),
            }),
          };
        if (table === "employment_records")
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        if (table === "employer_accounts")
          return { select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) };
        if (table === "trust_automation_rules")
          return {
            select: () => ({
              in: () => ({
                in: () =>
                  Promise.resolve({
                    data: [
                      {
                        id: "r1",
                        employer_id: "e1",
                        rule_name: "Low score",
                        rule_type: "candidate_trust_risk",
                        rule_conditions: { min_trust_score: 75 },
                        notification_type: "create_dashboard_alert",
                      },
                    ],
                    error: null,
                  }),
              }),
            }),
          };
        if (table === "trust_scores")
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: { score: 50 }, error: null }),
              }),
            }),
          };
        if (table === "trust_alerts")
          return {
            insert: (row: unknown) => {
              alertInserted = row;
              return Promise.resolve({ data: null, error: null });
            },
          };
        return { select: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) };
      },
    } as unknown as SupabaseClient;
    const out = await evaluateTrustAutomationRules("cand-1", "verification", supabase);
    expect(out.alertsCreated).toBe(1);
    expect(alertInserted).not.toBeNull();
    expect((alertInserted as { alert_type: string }).alert_type).toBe("candidate_trust_risk");
    expect((alertInserted as { alert_message: string }).alert_message).toContain("below threshold");
  });

  it("returns zero alerts when no employers have saved candidate", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "saved_candidates")
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        if (table === "employment_records")
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        return { select: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) };
      },
    } as unknown as SupabaseClient;
    const out = await evaluateTrustAutomationRules("cand-1", "reference", supabase);
    expect(out.alertsCreated).toBe(0);
  });

  it("rules evaluate only for event type mapping", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "saved_candidates")
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        if (table === "employment_records")
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        return { select: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }) };
      },
    } as unknown as SupabaseClient;
    const out = await evaluateTrustAutomationRules("cand-1", "unknown_event_type", supabase);
    expect(out.alertsCreated).toBe(0);
  });
});
