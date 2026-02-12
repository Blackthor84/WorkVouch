import { redirect } from "next/navigation";
import { requireUser } from "./requireUser";

export type SuperAdminProfile = {
  role: string | null;
};

export type RequireSuperAdminResult = {
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerSupabase>>;
  user: { id: string; email?: string | null };
  profile: SuperAdminProfile;
};

/**
 * Centralized auth: ensure user is superadmin only.
 * Returns { supabase, user, profile }. Use for superadmin-only server pages.
 */
export async function requireSuperAdmin(): Promise<RequireSuperAdminResult> {
  const { supabase, user } = await requireUser();

  const supabaseAny = supabase as any;
  const { data: profileRow } = await supabaseAny
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let role: string | null = (profileRow as { role?: string } | null)?.role ?? null;
  if (role !== "superadmin") {
    const { data: roles } = await supabaseAny
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleList = (roles ?? []) as { role: string }[];
    if (roleList.some((r) => r.role === "superadmin")) {
      role = "superadmin";
    }
  }

  if (role !== "superadmin") {
    redirect("/dashboard");
  }

  return {
    supabase,
    user,
    profile: { role },
  };
}
