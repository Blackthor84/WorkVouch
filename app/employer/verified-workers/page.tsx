import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { VerifiedWorkersDashboardClient } from "@/components/employer/VerifiedWorkersDashboardClient";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { getAppModeFromHeaders } from "@/lib/app-mode";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type UserRole = "superadmin" | "admin" | "employer" | "user";

export default async function EmployerVerifiedWorkersPage() {
  const headersList = await headers();
  const isSandbox = getAppModeFromHeaders(headersList) === "sandbox";
  if (isSandbox) {
    redirect("/employer/dashboard");
  }

  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const emailVerified = Boolean((user as { email_confirmed_at?: string | null }).email_confirmed_at);
  if (!emailVerified) {
    redirect("/verify-email");
  }

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
    .select("plan_tier")
    .eq("user_id", user.id)
    .maybeSingle();

  let planTier = String((employerAccount as { plan_tier?: string } | null)?.plan_tier || "free");
  if (isSuperAdmin) {
    planTier = "pro";
  }

  return (
    <EmployerPortalLayout wide>
      <VerifiedWorkersDashboardClient planTier={planTier} userRole={resolvedRole} />
    </EmployerPortalLayout>
  );
}
