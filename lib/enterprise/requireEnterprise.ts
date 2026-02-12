import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import type { TenantMembership, EnterpriseRole } from "./types";

export type EnterpriseSession = {
  userId: string;
  memberships: TenantMembership[];
  /** First organization where user is enterprise_owner (for convenience). */
  defaultOrganizationId: string | null;
  /** All organization IDs where user is enterprise_owner. */
  enterpriseOwnerOrgIds: string[];
  /** All location IDs where user has location_admin or recruiter. */
  locationIds: string[];
};

/**
 * Load current user's tenant memberships (service role so API can read without RLS).
 * Throws Unauthorized if no session.
 */
export async function getEnterpriseSession(): Promise<EnterpriseSession> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const supabase = getSupabaseServer();
  const { data: rows, error } = await supabase
    .from("tenant_memberships")
    .select("id, user_id, organization_id, location_id, role, created_at, updated_at")
    .eq("user_id", session.user.id);

  if (error) {
    console.error("[requireEnterprise] tenant_memberships select error:", error);
    throw new Error("Forbidden");
  }
  const memberships = (rows ?? []) as TenantMembership[];
  const enterpriseOwnerOrgIds = memberships
    .filter((m) => m.role === "enterprise_owner")
    .map((m) => m.organization_id);
  const locationIds = memberships
    .filter((m) => m.location_id != null)
    .map((m) => m.location_id as string);

  return {
    userId: session.user.id,
    memberships,
    defaultOrganizationId: enterpriseOwnerOrgIds[0] ?? null,
    enterpriseOwnerOrgIds,
    locationIds,
  };
}

/**
 * Require current user to be enterprise_owner for the given organization (or any org if orgId is null).
 * Throws Unauthorized or Forbidden if not allowed.
 */
export async function requireEnterpriseOwner(organizationId?: string | null): Promise<EnterpriseSession> {
  const ent = await getEnterpriseSession();
  const isPlatformAdmin =
    (await import("@/lib/admin/requireAdmin").then((m) => m.requireAdmin().catch(() => null))) != null;
  if (isPlatformAdmin) {
    return ent;
  }
  const hasOrg = ent.enterpriseOwnerOrgIds.length > 0;
  if (!hasOrg) {
    throw new Error("Forbidden: Enterprise owner role required");
  }
  if (organizationId != null && !ent.enterpriseOwnerOrgIds.includes(organizationId)) {
    throw new Error("Forbidden: No access to this organization");
  }
  return ent;
}

/**
 * Require current user to have access to the given location: either enterprise_owner of the location's org, or location_admin/recruiter for that location.
 * Throws if not allowed.
 */
export async function requireLocationAccess(locationId: string): Promise<EnterpriseSession> {
  const ent = await getEnterpriseSession();
  const isPlatformAdmin =
    (await import("@/lib/admin/requireAdmin").then((m) => m.requireAdmin().catch(() => null))) != null;
  if (isPlatformAdmin) {
    return ent;
  }
  if (ent.locationIds.includes(locationId)) {
    return ent;
  }
  const supabase = getSupabaseServer();
  const { data: loc } = await supabase.from("locations").select("organization_id").eq("id", locationId).single();
  if (loc && ent.enterpriseOwnerOrgIds.includes(loc.organization_id)) {
    return ent;
  }
  throw new Error("Forbidden: No access to this location");
}

/**
 * Require one of the given enterprise roles in the given organization (and optionally location).
 */
export async function requireEnterpriseRole(
  organizationId: string,
  allowedRoles: EnterpriseRole[],
  locationId?: string | null
): Promise<EnterpriseSession> {
  const ent = await getEnterpriseSession();
  const isPlatformAdmin =
    (await import("@/lib/admin/requireAdmin").then((m) => m.requireAdmin().catch(() => null))) != null;
  if (isPlatformAdmin) {
    return ent;
  }
  const hasRole = ent.memberships.some(
    (m) =>
      m.organization_id === organizationId &&
      allowedRoles.includes(m.role) &&
      (locationId == null ? true : m.location_id === locationId)
  );
  if (!hasRole) {
    throw new Error("Forbidden: Required enterprise role not found");
  }
  return ent;
}
