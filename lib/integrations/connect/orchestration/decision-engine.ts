import { ATS_EVENT_TYPES } from "../../core/events/ats-event-types";
import type { DecisionResult, LifecycleDecision, RuleEvaluationContext, RuleEvaluationResult } from "./types";

/** Maps rule evaluation results to lifecycle decisions and workflow actions. */
export class DecisionEngine {
  decide(context: RuleEvaluationContext, evaluation: RuleEvaluationResult): DecisionResult {
    if (context.alreadyInvited) {
      return { decision: "ignore", action: "ignore", reason: "Candidate already invited" };
    }

    if (context.universalEvent === ATS_EVENT_TYPES.CandidateRejected ||
        context.universalEvent === ATS_EVENT_TYPES.CandidateWithdrawn) {
      return { decision: "archive", action: "archive", reason: "Candidate rejected or withdrawn" };
    }

    if (!evaluation.eligible) {
      const manualOnly = evaluation.primaryRuleId === "manual_only";
      if (manualOnly) {
        return { decision: "wait", action: "wait", reason: "Manual-only mode — awaiting recruiter action" };
      }
      return { decision: "ignore", action: "ignore", reason: "No matching automation rule" };
    }

    const delayMs = context.preferences.autoInviteDelayHours * 60 * 60 * 1000;

    if (context.universalEvent === ATS_EVENT_TYPES.OfferAccepted) {
      return {
        decision: "request_references",
        action: "request_references",
        reason: "Offer accepted — request references",
        ruleId: evaluation.primaryRuleId,
      };
    }

    if (context.universalEvent === ATS_EVENT_TYPES.CandidateHired) {
      return {
        decision: "invite",
        action: "create_verification",
        reason: "Hired — start employment verification",
        ruleId: evaluation.primaryRuleId,
      };
    }

    return {
      decision: "invite",
      action: "invite_candidate",
      reason: `Auto-invite triggered by ${evaluation.primaryRuleId}`,
      ruleId: evaluation.primaryRuleId,
      delayMs: delayMs > 0 ? delayMs : undefined,
    };
  }
}

export function decisionToLifecycleTransition(
  decision: LifecycleDecision,
  currentState?: import("./types").LifecycleState
): import("./types").LifecycleState {
  switch (decision) {
    case "invite":
      return currentState === "invited" ? "invited" : "eligible";
    case "wait":
      return currentState ?? "pending";
    case "request_references":
      return "reference_collection";
    case "pause":
      return "pending";
    case "archive":
      return "archived";
    case "ignore":
    default:
      return currentState ?? "imported";
  }
}
