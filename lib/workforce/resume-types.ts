/**
 * Structured resume output from AI parsing layer.
 * Stored in workforce_resumes.parsed_json.
 * Same schema in sandbox and production.
 */

export interface WorkHistoryEntry {
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
  work_history: WorkHistoryEntry[];
  skills: string[];
  certifications: string[];
}

export const PARSED_RESUME_KEYS = [
  "full_name",
  "email",
  "phone",
  "work_history",
  "skills",
  "certifications",
] as const;
