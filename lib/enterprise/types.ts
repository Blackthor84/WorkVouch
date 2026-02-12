/** Enterprise multi-tenant types. Align with supabase migrations. */

export type BillingTier = "starter" | "professional" | "enterprise" | "custom";

export type EnterpriseRole = "enterprise_owner" | "location_admin" | "recruiter";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  billing_tier: BillingTier;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  location_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMembership {
  id: string;
  user_id: string;
  organization_id: string;
  location_id: string | null;
  role: EnterpriseRole;
  created_at: string;
  updated_at: string;
}

export interface LocationUsage {
  id: string;
  location_id: string;
  period_date: string;
  metric_name: string;
  metric_value: number;
  created_at: string;
}

export interface OrganizationUsageRollup {
  organization_id: string;
  period_date: string;
  metric_name: string;
  total_value: number;
  location_count: number;
}
