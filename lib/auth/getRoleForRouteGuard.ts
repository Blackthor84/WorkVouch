/**
 * Get current user's role from profiles.role for route guards.
 */

import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";

export type RouteGuardRole = "employee" | "employer" | "admin" | "pending";

/**
 * Returns normalized role, or null if not authenticated.
 */
export async function getRoleForRouteGuard(): Promise<RouteGuardRole | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();

  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  const resolved = resolveUserRole({ role: data?.role });

  if (resolved === "pending") return "pending";
  if (resolved === "super_admin") return "admin";
  if (resolved === "employer") return "employer";
  if (resolved === "employee") return "employee";
  return "pending";
}
