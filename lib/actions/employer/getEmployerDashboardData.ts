"use server";

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import {
  getRecentProfileViews,
  type RecentView,
} from "@/lib/actions/employer/employerDashboardStats";

export type UserRole = "superadmin" | "admin" | "employer" | "user";

export type EmployerDashboardData = {
  userRole: UserRole;
  planTier: string;
  employerId: string | undefined;
  employerIndustry: string | null;
  recentViews: RecentView[];
};

/**
 * Single server loader for /employer/dashboard.
 * Auth, role, and employer account checks happen here once.
 */
export async function getEmployerDashboardData(): Promise<EmployerDashboardData> {
  const user = await getUser();
  if (!user) redirect("/login");

  const emailVerified = Boolean((user as { email_confirmed_at?: string | null }).email_confirmed_at);
  if (!emailVerified) redirect("/verify-email");

  type EmployerAccountRow = { id: string; plan_tier: string; industry_type?: string | null };
  type ProfileRow = { role?: string | null };

  const supabase = await createClient();
  const { data: profileRow } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const roleFromDb = (profileRow as ProfileRow | null)?.role;

  const resolvedRole: UserRole =
    roleFromDb === "superadmin" ||
    roleFromDb === "admin" ||
    roleFromDb === "employer" ||
    roleFromDb === "user"
      ? roleFromDb
      : "user";

  const isEmployer = resolvedRole === "employer";
  const isSuperAdmin = resolvedRole === "superadmin";
  if (!isEmployer && !isSuperAdmin) {
    redirect("/dashboard");
  }

  const { data: employerAccount } = await (supabase as any)
    .from("employer_accounts")
    .select("id, plan_tier, industry_type")
    .eq("user_id", user.id)
    .single();

  const planTier = (employerAccount as EmployerAccountRow | null)?.plan_tier || "free";
  const employerId = (employerAccount as EmployerAccountRow | null)?.id;
  const employerIndustry = (employerAccount as EmployerAccountRow | null)?.industry_type ?? null;

  const recentViews = await getRecentProfileViews(5);

  return {
    userRole: resolvedRole,
    planTier,
    employerId,
    employerIndustry,
    recentViews,
  };
}
