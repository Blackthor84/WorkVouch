/**
 * Trust Automation: event-driven rule engine.
 * Runs when trust events occur; does not scan the entire user database.
 * Uses: trust_score, trust_forecast, trust_policies, trust_events, verification coverage, dispute history.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateTrustPolicy } from "./policy";

export type RuleType =
  | "candidate_meets_policy"
  | "candidate_trust_risk"
  | "employee_trust_risk"
  | "verification_expiring"
  | "credential_shared";

export type NotificationType =
  | "send_notification"
  | "create_dashboard_alert"
  | "log_trust_event";

export type TrustAutomationRuleRow = {
  id: string;
  employer_id: string;
  rule_name: string;
  rule_type: string;
  rule_conditions: Record<string, unknown>;
  notification_type: string;
  created_at: string;
};

/** Trust event types (DB trust_events.event_type or trigger names) */
export type TriggerEventType =
  | "reference_added"
  | "employment_verified"
  | "dispute_filed"
  | "verification_expired"
  | "credential_shared";

/** DB event_type (trust_events) -> rule types to evaluate */
const EVENT_TO_RULE_TYPES: Record<string, RuleType[]> = {
  reference: ["candidate_meets_policy", "candidate_trust_risk"],
  verification: ["candidate_meets_policy", "candidate_trust_risk", "verification_expiring"],
  dispute: ["candidate_trust_risk", "employee_trust_risk"],
  credential_share: ["credential_shared"],
  verification_expired: ["verification_expiring"],
};

/**
 * Get employer profile IDs who have this profile as a saved candidate.
 */
async function getEmployerIdsWithSavedCandidate(
  candidateId: string,
  supabase: SupabaseClient
): Promise<string[]> {
  const { data } = await supabase
    .from("saved_candidates")
    .select("employer_id")
    .eq("candidate_id", candidateId);
  const rows = (data ?? []) as { employer_id: string }[];
  return [...new Set(rows.map((r) => r.employer_id))];
}

/**
 * Get employer profile IDs who have this profile as an employee (employment_records).
 * employer_id in employment_records is employer_accounts.id; we need profiles.id via employer_accounts.user_id.
 */
async function getEmployerProfileIdsWithEmployee(
  employeeProfileId: string,
  supabase: SupabaseClient
): Promise<string[]> {
  const { data: recs } = await supabase
    .from("employment_records")
    .select("employer_id")
    .eq("user_id", employeeProfileId);
  const employerAccountIds = [...new Set((recs ?? []).map((r: { employer_id: string }) => r.employer_id))];
  if (employerAccountIds.length === 0) return [];
  const { data: accounts } = await supabase
    .from("employer_accounts")
    .select("user_id")
    .in("id", employerAccountIds);
  return (accounts ?? []).map((a: { user_id: string }) => a.user_id);
}

/**
 * Evaluate a single rule against a profile and event. Returns true if the rule condition is met.
 */
async function evaluateRuleCondition(
  rule: TrustAutomationRuleRow,
  profileId: string,
  eventType: string,
  supabase: SupabaseClient
): Promise<{ met: boolean; message?: string }> {
  const cond = rule.rule_conditions || {};
  const ruleType = rule.rule_type as RuleType;

  if (ruleType === "candidate_meets_policy") {
    const policyId = cond.policy_id as string | undefined;
    if (!policyId) return { met: false };
    const result = await evaluateTrustPolicy(profileId, policyId, supabase);
    const met = result.matchScore >= 100;
    return {
      met,
      message: met
        ? `Candidate meets policy "${result.policyName}" (100% match).`
        : undefined,
    };
  }

  if (ruleType === "candidate_trust_risk") {
    const minScore = (cond.min_trust_score as number) ?? 0;
    const { data: scoreRow } = await supabase
      .from("trust_scores")
      .select("score")
      .eq("user_id", profileId)
      .maybeSingle();
    const score = scoreRow?.score != null ? Number(scoreRow.score) : 0;
    const met = score < minScore || eventType === "dispute";
    return {
      met,
      message: met
        ? eventType === "dispute"
          ? "Candidate has a recent dispute."
          : `Candidate trust score (${score}) below threshold (${minScore}).`
        : undefined,
    };
  }

  if (ruleType === "employee_trust_risk") {
    const minScore = (cond.min_trust_score as number) ?? 0;
    const { data: scoreRow } = await supabase
      .from("trust_scores")
      .select("score")
      .eq("user_id", profileId)
      .maybeSingle();
    const score = scoreRow?.score != null ? Number(scoreRow.score) : 0;
    const met = score < minScore || eventType === "dispute";
    return {
      met,
      message: met
        ? eventType === "dispute"
          ? "Employee has a recent dispute."
          : `Employee trust score (${score}) below threshold (${minScore}).`
        : undefined,
    };
  }

  if (ruleType === "verification_expiring") {
    // Condition could include expiry_window_days; for now we treat event as sufficient
    return {
      met: true,
      message: "Verification expiring or expired for this profile.",
    };
  }

  if (ruleType === "credential_shared") {
    return {
      met: true,
      message: "Credential was shared or viewed.",
    };
  }

  return { met: false };
}

/** Normalize trigger/API event name to DB event_type */
function normalizeEventType(eventType: string): string {
  const e = (eventType || "").toLowerCase();
  if (e === "reference_added" || e === "reference") return "reference";
  if (e === "employment_verified" || e === "verification") return "verification";
  if (e === "dispute_filed" || e === "dispute") return "dispute";
  if (e === "credential_shared" || e === "credential_share") return "credential_share";
  if (e === "verification_expired") return "verification_expired";
  return e;
}

/**
 * Run automation rules for a profile when a trust event occurs.
 * Event-driven: only considers employers linked to this profile (saved candidate or employee).
 */
export async function evaluateTrustAutomationRules(
  profileId: string,
  eventType: string,
  supabase: SupabaseClient
): Promise<{ alertsCreated: number }> {
  const normalized = normalizeEventType(eventType);
  const uniqueRuleTypes = [...new Set(EVENT_TO_RULE_TYPES[normalized] ?? [])] as RuleType[];
  if (uniqueRuleTypes.length === 0) return { alertsCreated: 0 };

  const [savedEmployerIds, employeeEmployerIds] = await Promise.all([
    getEmployerIdsWithSavedCandidate(profileId, supabase),
    getEmployerProfileIdsWithEmployee(profileId, supabase),
  ]);
  const employerIds = [...new Set([...savedEmployerIds, ...employeeEmployerIds])];
  if (employerIds.length === 0) return { alertsCreated: 0 };

  const { data: rules } = await supabase
    .from("trust_automation_rules")
    .select("id, employer_id, rule_name, rule_type, rule_conditions, notification_type")
    .in("employer_id", employerIds)
    .in("rule_type", uniqueRuleTypes);
  const ruleList = (rules ?? []) as TrustAutomationRuleRow[];
  let alertsCreated = 0;

  for (const rule of ruleList) {
    const isCandidateRule =
      rule.rule_type === "candidate_meets_policy" ||
      rule.rule_type === "candidate_trust_risk" ||
      rule.rule_type === "credential_shared";
    const isEmployeeRule = rule.rule_type === "employee_trust_risk";
    const isVerificationExpiring = rule.rule_type === "verification_expiring";
    const scopeMatch =
      (isCandidateRule && savedEmployerIds.includes(rule.employer_id)) ||
      (isEmployeeRule && employeeEmployerIds.includes(rule.employer_id)) ||
      (isVerificationExpiring &&
        (savedEmployerIds.includes(rule.employer_id) || employeeEmployerIds.includes(rule.employer_id)));
    if (!scopeMatch) continue;

    const { met, message } = await evaluateRuleCondition(
      rule,
      profileId,
      eventType,
      supabase
    );
    if (!met || !message) continue;

    const action = (rule.notification_type as NotificationType) || "create_dashboard_alert";
    if (action === "create_dashboard_alert") {
      const { error } = await supabase.from("trust_alerts").insert({
        employer_id: rule.employer_id,
        candidate_id: profileId,
        alert_type: rule.rule_type,
        alert_message: `[${rule.rule_name}] ${message}`,
        rule_id: rule.id,
      });
      if (!error) alertsCreated++;
    }
  }
  return { alertsCreated };
}
