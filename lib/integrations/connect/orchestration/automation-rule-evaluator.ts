import { ATS_EVENT_TYPES } from "../../core/events/ats-event-types";
import type {
  AutomationPreferences,
  AutomationRuleMatch,
  RuleEvaluationContext,
  RuleEvaluationResult,
} from "./types";

const STAGE_PATTERNS: Record<string, RegExp> = {
  phone_screen: /phone\s*screen|screening/i,
  final_interview: /final\s*interview|onsite|on-site/i,
  offer: /offer/i,
};

/** Evaluates employer automation rules against an ATS event context. */
export class AutomationRuleEvaluator {
  evaluate(context: RuleEvaluationContext): RuleEvaluationResult {
    const matches: AutomationRuleMatch[] = [];
    const prefs = context.preferences;

    matches.push(this.evaluateManualOnly(context));
    matches.push(this.evaluateJobFilter(context));
    matches.push(this.evaluateDepartmentFilter(context));
    matches.push(this.evaluateLocationFilter(context));
    matches.push(this.evaluateEmploymentTypeFilter(context));
    matches.push(this.evaluateInviteTrigger(context));

    const filtersPassed = matches
      .filter((m) => m.ruleId.startsWith("filter_"))
      .every((m) => m.matched);
    const triggerMatch = matches.find((m) => m.ruleId.startsWith("trigger_"));
    const manualBlock = matches.find((m) => m.ruleId === "manual_only");

    if (manualBlock?.matched) {
      return { matches, eligible: false, primaryRuleId: "manual_only" };
    }

    const eligible =
      filtersPassed &&
      triggerMatch?.matched === true &&
      !context.alreadyInvited &&
      prefs.autoInviteEnabled;

    return {
      matches,
      eligible,
      primaryRuleId: triggerMatch?.matched ? triggerMatch.ruleId : undefined,
    };
  }

  parsePreferences(raw: unknown): AutomationPreferences {
    if (!raw || typeof raw !== "object") {
      return { ...DEFAULT_EXPORT };
    }
    const obj = raw as Record<string, unknown>;
    const automation = (obj.automation ?? obj) as Record<string, unknown>;
    return {
      autoInviteEnabled: automation.auto_invite_enabled !== false,
      autoInviteTrigger: normalizeTrigger(String(automation.auto_invite_trigger ?? "final_interview")),
      autoInviteDelayHours: Number(automation.auto_invite_delay_hours ?? 0),
      jobFilterMode: normalizeFilterMode(String(automation.job_filter_mode ?? "all")),
      jobFilterIds: toStringArray(automation.job_filter_ids),
      departmentFilterMode: normalizeFilterMode(String(automation.department_filter_mode ?? "all")),
      departmentFilterIds: toStringArray(automation.department_filter_ids),
      locationFilterMode: normalizeFilterMode(String(automation.location_filter_mode ?? "all")),
      locationFilter: toStringArray(automation.location_filter),
      employmentTypeFilterMode: normalizeFilterMode(String(automation.employment_type_filter_mode ?? "all")),
      employmentTypeFilter: toStringArray(automation.employment_type_filter),
    };
  }

  private evaluateManualOnly(context: RuleEvaluationContext): AutomationRuleMatch {
    const manual =
      !context.preferences.autoInviteEnabled || context.preferences.autoInviteTrigger === "manual";
    return {
      ruleId: "manual_only",
      ruleName: "Manual Only",
      matched: manual,
      reason: manual ? "Automation disabled or manual trigger" : "Automation enabled",
    };
  }

  private evaluateJobFilter(context: RuleEvaluationContext): AutomationRuleMatch {
    const { jobFilterMode, jobFilterIds } = context.preferences;
    const jobId = context.application?.jobExternalId ?? context.candidate?.jobExternalId ?? "";
    if (jobFilterMode === "all") {
      return { ruleId: "filter_job", ruleName: "Job Filter", matched: true, reason: "All jobs allowed" };
    }
    const inList = jobFilterIds.includes(jobId);
    const matched = jobFilterMode === "selected" ? inList : !inList;
    return {
      ruleId: "filter_job",
      ruleName: "Job Filter",
      matched,
      reason: matched ? `Job ${jobId} passes filter` : `Job ${jobId} blocked by filter`,
    };
  }

  private evaluateDepartmentFilter(context: RuleEvaluationContext): AutomationRuleMatch {
    const dept = String(context.application?.metadata?.department ?? context.candidate?.metadata?.department ?? "");
    const { departmentFilterMode, departmentFilterIds } = context.preferences;
    if (departmentFilterMode === "all" || !dept) {
      return { ruleId: "filter_department", ruleName: "Department Filter", matched: true, reason: "All departments" };
    }
    const inList = departmentFilterIds.includes(dept);
    const matched = departmentFilterMode === "selected" ? inList : !inList;
    return { ruleId: "filter_department", ruleName: "Department Filter", matched, reason: `Department ${dept}` };
  }

  private evaluateLocationFilter(context: RuleEvaluationContext): AutomationRuleMatch {
    const country = String(context.application?.metadata?.country ?? context.candidate?.metadata?.country ?? "");
    const { locationFilterMode, locationFilter } = context.preferences;
    if (locationFilterMode === "all" || !country) {
      return { ruleId: "filter_location", ruleName: "Location Filter", matched: true, reason: "All locations" };
    }
    const inList = locationFilter.includes(country);
    const matched = locationFilterMode === "selected" ? inList : !inList;
    return { ruleId: "filter_location", ruleName: "Location Filter", matched, reason: `Location ${country}` };
  }

  private evaluateEmploymentTypeFilter(context: RuleEvaluationContext): AutomationRuleMatch {
    const empType = String(context.application?.metadata?.employmentType ?? "");
    const { employmentTypeFilterMode, employmentTypeFilter } = context.preferences;
    if (employmentTypeFilterMode === "all" || !empType) {
      return { ruleId: "filter_employment_type", ruleName: "Employment Type Filter", matched: true, reason: "All types" };
    }
    const inList = employmentTypeFilter.includes(empType);
    const matched = employmentTypeFilterMode === "selected" ? inList : !inList;
    return { ruleId: "filter_employment_type", ruleName: "Employment Type Filter", matched, reason: `Type ${empType}` };
  }

  private evaluateInviteTrigger(context: RuleEvaluationContext): AutomationRuleMatch {
    const trigger = context.preferences.autoInviteTrigger;
    const stage = context.stageName ?? context.application?.stageName ?? "";
    const event = context.universalEvent;

    let matched = false;
    let reason = "Trigger not matched";

    switch (trigger) {
      case "application":
        matched = event === ATS_EVENT_TYPES.ApplicationCreated;
        reason = matched ? "Application created trigger" : "Waiting for application";
        break;
      case "phone_screen":
        matched =
          event === ATS_EVENT_TYPES.CandidateMoved &&
          STAGE_PATTERNS.phone_screen.test(stage);
        reason = matched ? "Phone screen stage reached" : `Stage '${stage}' does not match phone screen`;
        break;
      case "final_interview":
        matched =
          event === ATS_EVENT_TYPES.CandidateMoved &&
          STAGE_PATTERNS.final_interview.test(stage);
        reason = matched ? "Final interview stage reached" : `Stage '${stage}' does not match final interview`;
        break;
      case "offer":
        matched =
          event === ATS_EVENT_TYPES.OfferCreated ||
          (event === ATS_EVENT_TYPES.CandidateMoved && STAGE_PATTERNS.offer.test(stage));
        reason = matched ? "Offer trigger matched" : "Waiting for offer";
        break;
      case "hire":
        matched = event === ATS_EVENT_TYPES.CandidateHired;
        reason = matched ? "Candidate hired" : "Waiting for hire";
        break;
      case "manual":
        matched = false;
        reason = "Manual only — no auto trigger";
        break;
    }

    return {
      ruleId: `trigger_${trigger}`,
      ruleName: `Invite after ${trigger}`,
      matched,
      reason,
    };
  }
}

const DEFAULT_EXPORT = {
  autoInviteEnabled: true,
  autoInviteTrigger: "final_interview" as const,
  autoInviteDelayHours: 0,
  jobFilterMode: "all" as const,
  jobFilterIds: [] as string[],
  departmentFilterMode: "all" as const,
  departmentFilterIds: [] as string[],
  locationFilterMode: "all" as const,
  locationFilter: [] as string[],
  employmentTypeFilterMode: "all" as const,
  employmentTypeFilter: [] as string[],
};

function normalizeTrigger(value: string): AutomationPreferences["autoInviteTrigger"] {
  const map: Record<string, AutomationPreferences["autoInviteTrigger"]> = {
    immediate: "application",
    application: "application",
    phone_screen: "phone_screen",
    final_interview: "final_interview",
    offer: "offer",
    hire: "hire",
    manual: "manual",
  };
  return map[value] ?? "final_interview";
}

function normalizeFilterMode(value: string): AutomationPreferences["jobFilterMode"] {
  if (value === "selected" || value === "excluded") return value;
  return "all";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}
