import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { EmployerHeader } from "@/components/employer/employer-header";
import { EmployerSidebar } from "@/components/employer/employer-sidebar";
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
    <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
      <EmployerSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <EmployerHeader />
        <main className="flex-1 overflow-x-hidden px-4 py-8 md:px-6 md:py-12">
          <VerifiedWorkersDashboardClient planTier={planTier} userRole={resolvedRole} />
        </main>
      </div>
    </div>
  );
}
