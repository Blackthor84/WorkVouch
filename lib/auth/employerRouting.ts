import { admin } from "@/lib/supabase-admin";
import { enterpriseOrgTablesAvailable } from "@/lib/employer/enterpriseOrgTables";

/**
 * Employer home after login or role selection.
 * Production (no organizations table): onboarding until employer_accounts exists.
 * Enterprise deploy: also requires tenant_memberships enterprise_owner row.
 */
export async function getEmployerHomePath(userId: string): Promise<string> {
  const { data: existingEmployer } = await admin
    .from("employer_accounts")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  const hasEmployer = Array.isArray(existingEmployer) && existingEmployer.length > 0;

  const enterpriseAvailable = await enterpriseOrgTablesAvailable(admin);
  if (!enterpriseAvailable) {
    return hasEmployer ? "/employer/dashboard" : "/employer/onboarding/start";
  }

  const { data: existingMemberships } = await admin
    .from("tenant_memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "enterprise_owner")
    .limit(1);

  const hasOrgOwner = Array.isArray(existingMemberships) && existingMemberships.length > 0;

  if (!hasEmployer || !hasOrgOwner) {
    return "/employer/onboarding/start";
  }

  return "/employer/dashboard";
}

/**
 * Enterprise portal entry — only when user has tenant membership.
 */
export async function getEnterpriseHomePath(userId: string): Promise<string | null> {
  const { data: memberships } = await admin
    .from("tenant_memberships")
    .select("organization_id, role")
    .eq("user_id", userId);

  if (!memberships?.length) {
    return null;
  }

  const owner = memberships.find((m) => m.role === "enterprise_owner");
  if (owner?.organization_id) {
    return `/enterprise/${owner.organization_id}/overview`;
  }

  const first = memberships[0];
  if (first?.organization_id) {
    return `/enterprise/${first.organization_id}/overview`;
  }

  return "/enterprise/dashboard";
}
