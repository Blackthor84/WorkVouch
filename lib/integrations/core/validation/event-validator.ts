import type { AtsEventType } from "../events/ats-event-types";
import { isAtsEventType } from "../events/ats-event-types";
import type { AtsApplication } from "../models/Application";
import type { AtsCandidate } from "../models/Candidate";
import type { AtsJob } from "../models/Job";
import type { ApplicationStatus } from "../../types/sync";
import { TRUST_STATUSES } from "../models/TrustStatus";
import { VERIFICATION_STATUSES } from "../models/VerificationStatus";
import type {
  EventValidationContext,
  EventValidationResult,
  TypedValidationError,
} from "./validation-types";

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
  "unknown",
];

/** In-memory dedup and ordering tracker for pipeline validation. */
export class EventSequenceTracker {
  private readonly seenEventIds = new Set<string>();
  private readonly lastSequenceByKey = new Map<string, number>();

  reset(): void {
    this.seenEventIds.clear();
    this.lastSequenceByKey.clear();
  }

  isDuplicate(eventId: string): boolean {
    return this.seenEventIds.has(eventId);
  }

  markSeen(eventId: string): void {
    this.seenEventIds.add(eventId);
  }

  isOutOfOrder(key: string, sequenceNumber: number): boolean {
    const last = this.lastSequenceByKey.get(key);
    return last !== undefined && sequenceNumber < last;
  }

  recordSequence(key: string, sequenceNumber: number): void {
    const last = this.lastSequenceByKey.get(key) ?? 0;
    this.lastSequenceByKey.set(key, Math.max(last, sequenceNumber));
  }
}

export class EventValidator {
  constructor(private readonly sequenceTracker: EventSequenceTracker = new EventSequenceTracker()) {}

  validateCandidate(candidate: AtsCandidate): EventValidationResult {
    const errors: TypedValidationError[] = [];
    const warnings: TypedValidationError[] = [];

    if (!candidate.externalId) {
      errors.push(missingId("externalId"));
    }
    if (!candidate.email) {
      warnings.push({
        code: "REQUIRED_FIELD_MISSING",
        field: "email",
        message: "Candidate email is recommended for auto-linking.",
      });
    }
    if (candidate.applicationStatus && !APPLICATION_STATUSES.includes(candidate.applicationStatus)) {
      errors.push(unknownEnum("applicationStatus", candidate.applicationStatus));
    }
    if (candidate.trustStatus && !TRUST_STATUSES.includes(candidate.trustStatus)) {
      errors.push(unknownEnum("trustStatus", candidate.trustStatus));
    }
    if (
      candidate.verificationStatus &&
      !VERIFICATION_STATUSES.includes(candidate.verificationStatus)
    ) {
      errors.push(unknownEnum("verificationStatus", candidate.verificationStatus));
    }

    return finalize(errors, warnings);
  }

  validateJob(job: AtsJob): EventValidationResult {
    const errors: TypedValidationError[] = [];
    const warnings: TypedValidationError[] = [];

    if (!job.externalId) errors.push(missingId("externalId"));
    if (!job.title) errors.push(requiredField("title"));
    if (!["open", "closed", "draft", "archived"].includes(job.status)) {
      errors.push(unknownEnum("status", job.status));
    }
    if (job.location?.country === "US" && !job.location.state) {
      errors.push({
        code: "REQUIRED_FIELD_MISSING",
        field: "location.state",
        message: "US jobs require a state code.",
      });
    }

    return finalize(errors, warnings);
  }

  validateApplication(application: AtsApplication): EventValidationResult {
    const errors: TypedValidationError[] = [];
    const warnings: TypedValidationError[] = [];

    if (!application.externalId) errors.push(missingId("externalId"));
    if (!application.candidateExternalId) errors.push(missingId("candidateExternalId"));
    if (!application.jobExternalId) {
      if (application.status === "offer" || application.offerExternalId) {
        warnings.push({
          code: "REQUIRED_FIELD_MISSING",
          field: "jobExternalId",
          message: "Job external ID missing for offer event.",
        });
      } else {
        errors.push(missingId("jobExternalId"));
      }
    }
    if (!APPLICATION_STATUSES.includes(application.status)) {
      errors.push(invalidStatus(application.status));
    }

    return finalize(errors, warnings);
  }

  validateEventType(eventType: string): EventValidationResult {
    if (!isAtsEventType(eventType)) {
      return finalize(
        [
          {
            code: "UNKNOWN_ENUM",
            field: "universalEvent",
            message: `Unknown universal event type: ${eventType}`,
          },
        ],
        []
      );
    }
    return finalize([], []);
  }

  validateEventContext(context: EventValidationContext): EventValidationResult {
    const errors: TypedValidationError[] = [];
    const warnings: TypedValidationError[] = [];

    if (context.eventId && this.sequenceTracker.isDuplicate(context.eventId)) {
      errors.push({
        code: "DUPLICATE_EVENT",
        field: "eventId",
        message: `Duplicate event ID: ${context.eventId}`,
      });
      return finalize(errors, warnings);
    }

    if (
      context.eventId &&
      context.sequenceNumber !== undefined &&
      context.eventType
    ) {
      const key = `${context.eventType}:${context.eventId.split(":")[0]}`;
      if (this.sequenceTracker.isOutOfOrder(key, context.sequenceNumber)) {
        errors.push({
          code: "OUT_OF_ORDER_EVENT",
          field: "sequenceNumber",
          message: `Out-of-order event for ${key}`,
        });
        return finalize(errors, warnings);
      }
    }

    if (context.eventId) {
      this.sequenceTracker.markSeen(context.eventId);
      if (context.sequenceNumber !== undefined && context.eventType) {
        const key = `${context.eventType}:${context.eventId.split(":")[0]}`;
        this.sequenceTracker.recordSequence(key, context.sequenceNumber);
      }
    }

    return finalize(errors, warnings);
  }

  reset(): void {
    this.sequenceTracker.reset();
  }
}

function requiredField(field: string): TypedValidationError {
  return {
    code: "REQUIRED_FIELD_MISSING",
    field,
    message: `${field} is required.`,
  };
}

function missingId(field: string): TypedValidationError {
  return {
    code: "MISSING_ID",
    field,
    message: `${field} is required.`,
  };
}

function unknownEnum(field: string, value: unknown): TypedValidationError {
  return {
    code: "UNKNOWN_ENUM",
    field,
    message: `Unknown value for ${field}: ${String(value)}`,
  };
}

function invalidStatus(value: unknown): TypedValidationError {
  return {
    code: "INVALID_STATUS",
    field: "status",
    message: `Invalid application status: ${String(value)}`,
  };
}

function finalize(
  errors: TypedValidationError[],
  warnings: TypedValidationError[]
): EventValidationResult {
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function mergeValidationResults(
  ...results: EventValidationResult[]
): EventValidationResult {
  const errors = results.flatMap((result) => result.errors);
  const warnings = results.flatMap((result) => result.warnings);
  return { valid: errors.length === 0, errors, warnings };
}

export function validationMessages(result: EventValidationResult): {
  errors: string[];
  warnings: string[];
} {
  return {
    errors: result.errors.map((error) => error.message),
    warnings: result.warnings.map((warning) => warning.message),
  };
}
