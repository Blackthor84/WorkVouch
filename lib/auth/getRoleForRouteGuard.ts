/**
 * Get current user's role from profiles.role (with app_metadata fallback) for route guards.
 * Use with redirect('/unauthorized') when role doesn't match the route.
 */

import { createServerSupabase } from "@/lib/supabase/server";

export type RouteGuardRole = "employee" | "employer" | "admin";

/**
 * Returns normalized role: 'employee' | 'employer' | 'admin' (admin includes superadmin), or null if not authenticated.
 */
export async function getRoleForRouteGuard(): Promise<RouteGuardRole | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const raw = (data?.role ?? (user as { app_metadata?: { role?: string } }).app_metadata?.role ?? "").toString().trim().toLowerCase();
  if (raw === "employer") return "employer";
  if (raw === "employee") return "employee";
  if (raw === "admin" || raw === "superadmin") return "admin";
  return null;
}
