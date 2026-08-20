/** Greenhouse provider-specific typed models (Harvest / webhook payloads). */

export interface GreenhouseEmailAddress {
  value: string;
  type?: string;
}

export interface GreenhousePhoneNumber {
  value: string;
  type?: string;
}

export interface GreenhouseStage {
  id: number;
  name: string;
}

export interface GreenhouseJobRef {
  id: number;
  name: string;
}

export interface GreenhouseCustomField {
  name: string;
  type?: string;
  value?: string | number | boolean | null;
}

/** V3 list custom field definitions. */
export interface GreenhouseCustomFieldDefinition {
  id: number;
  name: string;
  field_type?: string;
  value_type?: string;
  active?: boolean;
}

/** V3 candidate employment history (separate resource). */
export interface GreenhouseCandidateEmployment {
  id: number;
  candidate_id: number;
  company_name?: string;
  title?: string;
  start_date?: string;
  end_date?: string | null;
  updated_at?: string;
}

/** V3 job interview stage. */
export interface GreenhouseJobInterviewStage {
  id: number;
  job_id?: number;
  name: string;
  priority?: number;
  updated_at?: string;
}

export interface GreenhouseCandidate {
  id: number;
  first_name: string;
  last_name: string;
  email_addresses?: GreenhouseEmailAddress[];
  phone_numbers?: GreenhousePhoneNumber[];
  applications?: GreenhouseApplication[];
  custom_fields?: GreenhouseCustomField[] | Record<string, GreenhouseCustomField>;
  created_at?: string;
  updated_at?: string;
}

export interface GreenhouseApplication {
  id: number;
  candidate_id: number;
  jobs?: GreenhouseJobRef[];
  status?: string;
  current_stage?: GreenhouseStage;
  applied_at?: string;
  updated_at?: string;
  custom_fields?: GreenhouseCustomField[] | Record<string, GreenhouseCustomField>;
}

export interface GreenhouseJob {
  id: number;
  name: string;
  status?: string;
  departments?: Array<{ id: number; name: string }>;
  offices?: Array<{ id: number; name: string; location?: { name?: string } }>;
  opened_at?: string;
  closed_at?: string;
  custom_fields?: GreenhouseCustomField[] | Record<string, GreenhouseCustomField>;
}

export interface GreenhouseOffer {
  id: number;
  application_id: number;
  candidate_id: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GreenhouseCompany {
  id: number;
  name: string;
}

export interface GreenhouseUser {
  id: number;
  name: string;
  email: string;
}

export interface GreenhouseWebhookPayload {
  action: string;
  payload: Record<string, unknown>;
}

export type GreenhouseWebhookAction =
  | "candidate_created"
  | "candidate_updated"
  | "application_created"
  | "application_updated"
  | "application_stage_changed"
  | "job_created"
  | "job_updated"
  | "offer_created"
  | "offer_accepted"
  | "offer_rejected"
  | "hire_candidate"
  | "reject_candidate"
  | "candidate_withdrawn";
