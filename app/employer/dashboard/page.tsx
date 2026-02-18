import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { EmployerHeader } from "@/components/employer/employer-header";
import { EmployerSidebar } from "@/components/employer/employer-sidebar";
import { EmployerDashboardClient } from "@/components/employer/EmployerDashboardClient";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAppModeFromHeaders, getSandboxIdFromHeaders } from "@/lib/app-mode";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

type UserRole = "superadmin" | "admin" | "employer" | "user";

// Mark as dynamic
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function EmployerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const headersList = await headers();
  const isSandbox = getAppModeFromHeaders(headersList) === "sandbox";
  const sandboxId = getSandboxIdFromHeaders(headersList);
  const params = await searchParams;
  const showWelcome = params.welcome === "1";

  if (!isSandbox) {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const emailVerified = Boolean((user as { email_confirmed_at?: string | null }).email_confirmed_at);
    if (!emailVerified) {
      redirect("/verify-email");
    }

    type EmployerAccountRow = { id: string; plan_tier: string; industry_type?: string | null };
    type ProfileRow = { role?: string | null };
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
    const userRole: UserRole = resolvedRole;

    return (
      <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
        <EmployerSidebar />
        <div className="flex-1 flex flex-col">
          <EmployerHeader />
          <main className="flex-1 flex flex-col px-4 py-8 md:px-6 md:py-12 lg:py-16 min-w-0 overflow-x-hidden">
            <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
              <EmployerDashboardClient
                userRole={userRole}
                planTier={planTier}
                employerId={employerId}
                employerIndustry={employerIndustry}
                showWelcome={showWelcome}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!sandboxId) {
    redirect("/login");
  }
  const supabase = getServiceRoleClient();
  const { data: employers } = await supabase
    .from("sandbox_employers")
    .select("id, plan_tier, industry")
    .eq("sandbox_id", sandboxId)
    .limit(1);
  const first = Array.isArray(employers) ? employers[0] : null;
  const planTier = (first as { plan_tier?: string } | null)?.plan_tier ?? "pro";
  const employerId = (first as { id?: string } | null)?.id ?? null;
  const employerIndustry = (first as { industry?: string } | null)?.industry ?? null;

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
      <EmployerSidebar />
      <div className="flex-1 flex flex-col">
        <EmployerHeader />
        <main className="flex-1 flex flex-col px-4 py-8 md:px-6 md:py-12 lg:py-16 min-w-0 overflow-x-hidden">
          <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
            <EmployerDashboardClient
              userRole="employer"
              planTier={planTier}
              employerId={employerId ?? undefined}
              employerIndustry={employerIndustry ?? null}
              sandboxMode={true}
              sandboxId={sandboxId}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
