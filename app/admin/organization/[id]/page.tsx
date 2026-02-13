import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { supabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getAdminContext();
  if (!ctx.authorized) redirect("/login");
  const supabase = await supabaseServer();
  const supabaseAny = supabase as any;
  const { id: orgId } = await params;
  const userId = ctx.user?.id;

  if (!ctx.isSuperAdmin && userId) {
    const { data: myOrgs } = await supabaseAny
      .from("employer_users")
      .select("organization_id")
      .eq("profile_id", userId);
    const orgIds = [...new Set((myOrgs ?? []).map((r: { organization_id: string }) => r.organization_id))];
    const { data: tenantOrgs } = await supabaseAny
      .from("tenant_memberships")
      .select("organization_id")
      .eq("user_id", userId)
      .in("role", ["enterprise_owner", "location_admin"]);
    (tenantOrgs ?? []).forEach((r: { organization_id: string }) => orgIds.push(r.organization_id));
    const allowedOrgIds = [...new Set(orgIds)];
    if (!allowedOrgIds.includes(orgId)) {
      redirect("/admin");
    }
  }

  const { data: org } = await supabaseAny
    .from("organizations")
    .select("id, name, industry, enterprise_plan, billing_contact_email")
    .eq("id", orgId)
    .single();
  if (!org) {
    redirect("/admin");
  }

  const { data: locations } = await supabaseAny
    .from("locations")
    .select("id, name, address, city, state, status")
    .eq("organization_id", orgId)
    .order("name");

  const { data: orgIntel } = await supabaseAny
    .from("organization_intelligence")
    .select("avg_hiring_confidence, fraud_density, dispute_rate, rehire_rate, updated_at")
    .eq("organization_id", orgId)
    .maybeSingle();

  const employeesByLocation: { locationId: string; count: number }[] = [];
  for (const loc of locations ?? []) {
    const { count } = await supabaseAny
      .from("workforce_employees")
      .select("id", { count: "exact", head: true })
      .eq("location_id", loc.id);
    employeesByLocation.push({ locationId: loc.id, count: count ?? 0 });
  }

  const { data: historyRows } = await supabaseAny
    .from("intelligence_history")
    .select("new_score, created_at")
    .eq("organization_id", orgId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: true });

  const trendData = (historyRows ?? []).map((r: { new_score: number; created_at: string }) => ({
    score: Number(r.new_score),
    date: r.created_at,
  }));

  const totalEmployees = employeesByLocation.reduce((s, x) => s + x.count, 0);

  return (
    <div className="max-w-5xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Organization: {org.name}
        </h1>
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Back to Admin
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg hiring confidence</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {orgIntel?.avg_hiring_confidence != null
              ? Number(orgIntel.avg_hiring_confidence).toFixed(1)
              : "—"}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Fraud density</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {orgIntel?.fraud_density != null
              ? Number(orgIntel.fraud_density).toFixed(2)
              : "—"}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Rehire rate</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {orgIntel?.rehire_rate != null
              ? `${(Number(orgIntel.rehire_rate) * 100).toFixed(1)}%`
              : "—"}
          </p>
        </div>
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Dispute rate</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {orgIntel?.dispute_rate != null
              ? `${(Number(orgIntel.dispute_rate) * 100).toFixed(1)}%`
              : "—"}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Locations
        </h2>
        <ul className="space-y-2">
          {(locations ?? []).map((loc: { id: string; name: string; city?: string; state?: string; status?: string }) => {
            const count = employeesByLocation.find((e) => e.locationId === loc.id)?.count ?? 0;
            return (
              <li
                key={loc.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {loc.name}
                  {loc.city || loc.state ? ` (${[loc.city, loc.state].filter(Boolean).join(", ")})` : ""}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {count} employees · {loc.status ?? "active"}
                </span>
              </li>
            );
          })}
        </ul>
        {(!locations || locations.length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No locations.</p>
        )}
      </div>

      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Employees per location
        </h2>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
          {totalEmployees} total
        </p>
      </div>

      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Intelligence trend (last 30 days)
        </h2>
        {trendData.length > 0 ? (
          <div className="h-48 flex items-end gap-0.5">
            {trendData.map((d: { score: number; date: string }, i: number) => (
              <div
                key={i}
                className="flex-1 min-w-0 bg-blue-500 rounded-t"
                style={{ height: `${Math.max(0, Math.min(100, d.score))}%` }}
                title={`${d.score} at ${d.date}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No intelligence history for this org in the last 30 days.
          </p>
        )}
      </div>

      {(org.industry || org.enterprise_plan || org.billing_contact_email) && (
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">
          {org.industry && <p>Industry: {org.industry}</p>}
          {org.enterprise_plan && <p>Plan: {org.enterprise_plan}</p>}
          {org.billing_contact_email && <p>Billing: {org.billing_contact_email}</p>}
        </div>
      )}
    </div>
  );
}
