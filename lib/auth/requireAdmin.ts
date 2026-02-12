import { redirect } from "next/navigation";
import { requireUser } from "./requireUser";

export type AdminProfile = {
  role: string | null;
};

export type RequireAdminResult = {
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerSupabase>>;
  user: { id: string; email?: string | null };
  profile: AdminProfile;
};

/**
 * Centralized auth: ensure user is admin or superadmin (profiles.role or user_roles).
 * Returns { supabase, user, profile }. Use for all /admin server pages.
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  const { supabase, user } = await requireUser();

  const supabaseAny = supabase as any;
  const { data: profileRow } = await supabaseAny
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let role: string | null = (profileRow as { role?: string } | null)?.role ?? null;
  if (role !== "admin" && role !== "superadmin") {
    const { data: roles } = await supabaseAny
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleList = (roles ?? []) as { role: string }[];
    if (roleList.some((r) => r.role === "admin" || r.role === "superadmin")) {
      role = roleList.find((r) => r.role === "superadmin")?.role ?? roleList.find((r) => r.role === "admin")?.role ?? null;
    }
  }

  if (!role || (role !== "admin" && role !== "superadmin")) {
    redirect("/dashboard");
  }

  return {
    supabase,
    user,
    profile: { role },
  };
}
