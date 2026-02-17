/**
 * Structured resume output from AI parsing layer.
 * Stored in workforce_resumes.parsed_json.
 * Same schema in sandbox and production.
 */

export interface JobHistoryEntry {
  company: string;
  title: string;
  start_date: string;
  end_date: string | null;
  location?: string;
}

export interface ParsedResumeJson {
  full_name: string;
  email: string;
  phone?: string;
  job_history: JobHistoryEntry[];
  skills: string[];
  certifications: string[];
}

export const PARSED_RESUME_KEYS = [
  "full_name",
  "email",
  "phone",
  "job_history",
  "skills",
  "certifications",
] as const;
