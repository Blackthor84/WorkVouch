/**
 * Shared row types for DAL queries. Align with Supabase schema; do not change DB.
 */

export type ProfileRow = {
  id: string;
  full_name: string | null;
  industry: string | null;
  professional_summary: string | null;
  public_slug?: string | null;
  city?: string | null;
  state?: string | null;
};

export type JobRow = {
  id: string;
  company_name: string;
  title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  location: string | null;
};

export type JobVerificationRow = { job_id: string };

export type EmploymentRecordRow = {
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  verification_status: string;
};

export type TrustEventRow = { event_type: string };

export type TrustRelationshipRow = { id: string } | { relationship_type: string };
