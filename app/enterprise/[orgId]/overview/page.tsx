import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getEnvironmentForServer } from "@/lib/app-mode";
import { headers, cookies } from "next/headers";
import { EnterpriseRecommendedBanner } from "@/components/enterprise/EnterpriseRecommendedBanner";
import { WvPageHeader, WvStatCard, WvCard } from "@/components/wv";
import { Users, ShieldCheck, MessageSquare, TrendingUp, MapPin } from "lucide-react";

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
    <div className="max-w-5xl space-y-8">
      <EnterpriseRecommendedBanner orgId={orgId} />
      <WvPageHeader
        eyebrow={org.name}
        title="Overview"
        description="Workforce verification and peer reference activity across your organization."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <WvStatCard label="Total Employees" value={totalEmployees ?? 0} icon={Users} accent="blue" />
        <WvStatCard label="With References" value={verifiedCount} icon={ShieldCheck} accent="green" />
        <WvStatCard label="Peer References" value={totalRefs ?? 0} icon={MessageSquare} accent="violet" />
        <WvStatCard label="Completion Rate" value={completionRate} suffix="%" icon={TrendingUp} accent="amber" />
      </div>
      <WvCard>
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-blue-400" aria-hidden />
          <div>
            <p className="text-sm text-wv-muted">Cross-Location Matches</p>
            <p className="text-xl font-semibold text-wv-foreground">{locationCount} locations</p>
          </div>
        </div>
      </WvCard>
      <p className="text-sm text-wv-muted">References per month: graph placeholder (same data as production).</p>
    </div>
  );
}
