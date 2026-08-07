import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { EmployerPortalLayout } from "@/components/employer/EmployerPortalLayout";
import { EmployerDashboardClient } from "@/components/employer/EmployerDashboardClient";
import { getEmployerDashboardData } from "@/lib/actions/employer/getEmployerDashboardData";
import { getAppModeFromHeaders, getSandboxIdFromHeaders } from "@/lib/app-mode";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";

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
    const data = await getEmployerDashboardData();

    return (
      <EmployerPortalLayout>
        <EmployerDashboardClient
          userRole={data.userRole}
          planTier={data.planTier}
          employerId={data.employerId}
          employerIndustry={data.employerIndustry}
          showWelcome={showWelcome}
          recentViews={data.recentViews}
        />
      </EmployerPortalLayout>
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
    <EmployerPortalLayout>
      <EmployerDashboardClient
        userRole="employer"
        planTier={planTier}
        employerId={employerId ?? undefined}
        employerIndustry={employerIndustry ?? null}
        sandboxMode={true}
        sandboxId={sandboxId}
      />
    </EmployerPortalLayout>
  );
}
