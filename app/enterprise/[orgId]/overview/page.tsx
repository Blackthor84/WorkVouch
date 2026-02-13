import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getEnvironmentForServer } from "@/lib/app-mode";
import { headers, cookies } from "next/headers";
import { EnterpriseRecommendedBanner } from "@/components/enterprise/EnterpriseRecommendedBanner";

export const dynamic = "force-dynamic";

export default async function EnterpriseOverviewPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireEnterpriseOwner(orgId);
  const h = await headers();
  const c = await cookies();
  const env = getEnvironmentForServer(h, c);
  const supabase = getSupabaseServer();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", orgId)
    .eq("environment", env)
    .single();
  if (!org) return null;

  const { count: totalEmployees } = await supabase
    .from("workforce_employees")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("environment", env);

  const { count: totalRefs } = await supabase
    .from("workforce_peer_references")
    .select("id", { count: "exact", head: true })
    .eq("environment", env);

  const { data: refsWithEmployee } = await supabase
    .from("workforce_peer_references")
    .select("employee_id")
    .eq("environment", env);
  const uniqueEmployeesWithRefs = new Set((refsWithEmployee ?? []).map((r) => r.employee_id)).size;
  const verifiedCount = uniqueEmployeesWithRefs;
  const completionRate = (totalEmployees ?? 0) > 0 ? Math.round((verifiedCount / (totalEmployees ?? 1)) * 100) : 0;

  const { data: locations } = await supabase
    .from("locations")
    .select("id")
    .eq("organization_id", orgId)
    .eq("environment", env);
  const locationCount = locations?.length ?? 0;

  return (
    <div className="max-w-4xl space-y-8">
      <EnterpriseRecommendedBanner orgId={orgId} />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Employees</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalEmployees ?? 0}</p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Verified / With References</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{verifiedCount}</p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Peer References</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalRefs ?? 0}</p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{completionRate}%</p>
        </div>
      </div>
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">Cross-Location Matches</p>
        <p className="text-xl font-semibold text-gray-900 dark:text-white">{locationCount} locations</p>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">References per month: graph placeholder (same data as production).</p>
    </div>
  );
}
