/** Canonical Resume Intelligence types — Sprint 11 */

export const RESUME_UPLOAD_FIELD = "resume" as const;
export const RESUME_BUCKET = "resumes";
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "txt"] as const;

export type ConfidenceLevel = "high" | "medium" | "low";

export type ExtractedField<T> = {
  value: T;
  confidence: ConfidenceLevel;
  source: "resume";
};

export type ExtractedIdentity = {
  full_name?: ExtractedField<string>;
  email?: ExtractedField<string>;
  phone?: ExtractedField<string>;
  city?: ExtractedField<string>;
  state?: ExtractedField<string>;
  country?: ExtractedField<string>;
};

export type ExtractedEmployment = {
  client_id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  company_normalized: string;
  location: string | null;
  description: string | null;
  employment_type: string | null;
  confidence: ConfidenceLevel;
  source: "resume";
  /** Set when duplicate detection finds an existing record */
  duplicate_of: string | null;
  duplicate_match_reason: string | null;
};

export type ResumeUploadResponse = {
  success: true;
  /** Storage object key within the resumes bucket */
  path: string;
};

export type ResumeParseResponse = {
  identity: ExtractedIdentity;
  employment: ExtractedEmployment[];
  parse_status: "complete" | "partial" | "no_employment";
  warnings: string[];
};

export type IdentityConfirmInput = {
  apply: boolean;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

export type EmploymentConfirmItem = {
  client_id?: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  company_normalized?: string;
  duplicate_action?: "create" | "skip" | "update";
  existing_record_id?: string | null;
};

export type ResumeConfirmRequest = {
  employment: EmploymentConfirmItem[];
  identity?: IdentityConfirmInput;
  resume_path?: string | null;
};

export type ResumeConfirmResponse = {
  success: true;
  record_ids: string[];
  skipped_count: number;
  updated_count: number;
  profile_updated: boolean;
  verification_url: string;
};
