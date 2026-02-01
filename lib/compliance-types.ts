/**
 * Compliance infrastructure: dispute and security report types.
 * TypeScript-safe enums and interfaces; no any.
 */

/** Who is viewing the profile; controls visibility of rehire recommendation. */
export enum ViewerAccessLevel {
  Public = "Public",
  VerifiedEmployer = "VerifiedEmployer",
  Admin = "Admin",
}

export type ViewerAccessLevelValue = ViewerAccessLevel;

/** Visibility rules for rehire recommendation display. */
export function shouldShowRehireStatus(level: ViewerAccessLevel): boolean {
  return level === ViewerAccessLevel.VerifiedEmployer || level === ViewerAccessLevel.Admin;
}

export function shouldShowRehireReasonCategory(level: ViewerAccessLevel): boolean {
  return level === ViewerAccessLevel.VerifiedEmployer || level === ViewerAccessLevel.Admin;
}

export function shouldShowRehireDetailedExplanation(level: ViewerAccessLevel): boolean {
  return level === ViewerAccessLevel.Admin;
}

/** Show subtle safety label when recommendation exists but viewer is Public. */
export function shouldShowRehireSafetyLabel(
  level: ViewerAccessLevel,
  hasRecommendation: boolean
): boolean {
  return level === ViewerAccessLevel.Public && hasRecommendation;
}

/**
 * Optional configuration: when true, VerifiedEmployer must match employee industry
 * to view rehire recommendation. Used with industryMatchesForRehire().
 */
export type RequireIndustryMatchForRehireAccess = boolean;

/**
 * Optional: only allow VerifiedEmployer to see rehire if industry matches.
 * Returns true if rehire section may be shown (caller still checks viewer level).
 */
export function industryMatchesForRehire(
  employeeIndustry: string | null | undefined,
  viewerIndustry: string | null | undefined
): boolean {
  if (employeeIndustry == null || viewerIndustry == null) return true;
  const e = String(employeeIndustry).trim().toLowerCase();
  const v = String(viewerIndustry).trim().toLowerCase();
  if (e === "" || v === "") return true;
  return e === v;
}

export const ComplianceDisputeType = {
  RehireStatus: "RehireStatus",
  EmploymentDates: "EmploymentDates",
  PeerVerification: "PeerVerification",
  Other: "Other",
} as const;

export type ComplianceDisputeTypeValue =
  (typeof ComplianceDisputeType)[keyof typeof ComplianceDisputeType];

export const ComplianceDisputeStatus = {
  Pending: "Pending",
  UnderReview: "UnderReview",
  AwaitingEmployerResponse: "AwaitingEmployerResponse",
  Resolved: "Resolved",
  Rejected: "Rejected",
} as const;

export type ComplianceDisputeStatusValue =
  (typeof ComplianceDisputeStatus)[keyof typeof ComplianceDisputeStatus];

export interface ComplianceDisputeRow {
  id: string;
  user_id: string;
  profile_id: string;
  dispute_type: ComplianceDisputeTypeValue;
  description: string;
  status: ComplianceDisputeStatusValue;
  reviewer_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export const SecurityReportSeverity = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
} as const;

export type SecurityReportSeverityValue =
  (typeof SecurityReportSeverity)[keyof typeof SecurityReportSeverity];

export const SecurityReportStatus = {
  Open: "Open",
  Investigating: "Investigating",
  Resolved: "Resolved",
} as const;

export type SecurityReportStatusValue =
  (typeof SecurityReportStatus)[keyof typeof SecurityReportStatus];

export interface SecurityReportRow {
  id: string;
  reporter_email: string;
  description: string;
  severity: SecurityReportSeverityValue;
  status: SecurityReportStatusValue;
  created_at: string;
}

/** Rehire recommendation (employer evaluation). */
export enum RehireRecommendation {
  Approved = "Approved",
  EligibleWithReview = "EligibleWithReview",
  NotEligible = "NotEligible",
}

/** Reason category when recommendation is not Approved. */
export enum RehireReasonCategory {
  AttendanceIssues = "AttendanceIssues",
  PolicyViolation = "PolicyViolation",
  PerformanceConcerns = "PerformanceConcerns",
  ContractCompletion = "ContractCompletion",
  RoleEliminated = "RoleEliminated",
  Other = "Other",
}

/** Legacy / DB compatibility: same values as RehireRecommendation. */
export const RehireStatusEnum = {
  Approved: "Approved",
  EligibleWithReview: "EligibleWithReview",
  NotEligible: "NotEligible",
} as const;

export type RehireStatusValue =
  (typeof RehireStatusEnum)[keyof typeof RehireStatusEnum];

/** Legacy / DB compatibility: same values as RehireReasonCategory. */
export const RehireReasonEnum = {
  AttendanceIssues: "AttendanceIssues",
  PolicyViolation: "PolicyViolation",
  PerformanceConcerns: "PerformanceConcerns",
  ContractCompletion: "ContractCompletion",
  RoleEliminated: "RoleEliminated",
  Other: "Other",
} as const;

export type RehireReasonValue =
  (typeof RehireReasonEnum)[keyof typeof RehireReasonEnum];
