/**
 * Enterprise RBAC: require one of allowed roles (platform + employer_users + tenant_memberships).
 * Use for server-side route protection: /admin (superadmin), /admin/org (org_admin), /admin/location (location_admin), /employer (location_admin + hiring_manager + employer).
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createServerSupabase } from "@/lib/supabase/server";

export type AllowedRole =
  | "superadmin"
  | "admin"
  | "org_admin"
  | "location_admin"
  | "hiring_manager"
  | "employer"
  | "employee";

export interface RequireRoleResult {
  userId: string;
  effectiveRoles: string[];
  isSuperAdmin: boolean;
  /** First employer_users row (org/location) when user has org_admin, location_admin, or hiring_manager. */
  employerUser?: {
    organizationId: string;
    locationId: string | null;
    role: string;
  };
}

/**
 * Get effective roles for the current user: platform (user_roles + profile.role) + employer_users + tenant_memberships (mapped to spec roles).
 */
export async function getEffectiveRoles(userId: string): Promise<string[]> {
  const supabase = await createServerSupabase();
  const supabaseAny = supabase as any;
  const roles: string[] = [];

  const { data: profile } = await supabaseAny
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (profile?.role) roles.push(profile.role);

  const { data: userRoles } = await supabaseAny
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (Array.isArray(userRoles)) {
    userRoles.forEach((r: { role: string }) => {
      if (r.role && !roles.includes(r.role)) roles.push(r.role);
    });
  }

  const { data: employerUserRows } = await supabaseAny
    .from("employer_users")
    .select("role")
    .eq("profile_id", userId);
  if (Array.isArray(employerUserRows)) {
    employerUserRows.forEach((r: { role: string }) => {
      if (r.role && !roles.includes(r.role)) roles.push(r.role);
    });
  }

  const { data: tenantRows } = await supabaseAny
    .from("tenant_memberships")
    .select("role")
    .eq("user_id", userId);
  if (Array.isArray(tenantRows)) {
    tenantRows.forEach((r: { role: string }) => {
      if (r.role === "enterprise_owner" && !roles.includes("org_admin")) roles.push("org_admin");
      if (r.role === "location_admin" && !roles.includes("location_admin")) roles.push("location_admin");
      if (r.role === "recruiter" && !roles.includes("hiring_manager")) roles.push("hiring_manager");
    });
  }

  const { data: employerAccount } = await supabaseAny
    .from("employer_accounts")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (employerAccount && !roles.includes("employer")) roles.push("employer");

  return [...new Set(roles)];
}

/**
 * Require the current user to have at least one of allowedRoles (platform + employer_users + tenant_memberships).
 * Throws "Unauthorized" or "Forbidden" if not allowed.
 */
export async function requireRole(
  allowedRoles: AllowedRole[]
): Promise<RequireRoleResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const userId = session.user.id;
  const effectiveRoles = await getEffectiveRoles(userId);
  const hasRole = allowedRoles.some((r) => effectiveRoles.includes(r));
  if (!hasRole) {
    throw new Error("Forbidden");
  }

  let employerUser: RequireRoleResult["employerUser"] | undefined;
  const supabase = await createServerSupabase();
  const supabaseAny = supabase as any;
  const { data: eu } = await supabaseAny
    .from("employer_users")
    .select("organization_id, location_id, role")
    .eq("profile_id", userId)
    .limit(1)
    .maybeSingle();
  if (eu) {
    employerUser = {
      organizationId: eu.organization_id,
      locationId: eu.location_id ?? null,
      role: eu.role,
    };
  }

  return {
    userId,
    effectiveRoles,
    isSuperAdmin: effectiveRoles.includes("superadmin"),
    employerUser,
  };
}
