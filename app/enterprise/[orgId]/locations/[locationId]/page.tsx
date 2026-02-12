import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLocationAccess } from "@/lib/enterprise/requireEnterprise";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function LocationDashboardPage({
  params,
}: {
  params: Promise<{ orgId: string; locationId: string }>;
}) {
  const { orgId, locationId } = await params;
  await requireLocationAccess(locationId);
  const supabase = getSupabaseServer();

  const { data: location } = await supabase
    .from("locations")
    .select("id, organization_id, name, slug, created_at")
    .eq("id", locationId)
    .single();
  if (!location || location.organization_id !== orgId) notFound();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", orgId)
    .single();

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, created_at")
    .eq("location_id", locationId)
    .order("name");

  const { data: usage } = await supabase
    .from("location_usage")
    .select("period_date, metric_name, metric_value")
    .eq("location_id", locationId)
    .order("period_date", { ascending: false })
    .limit(20);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link href={`/enterprise/${orgId}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block">
          ← {org?.name ?? "Organization"}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{location.name}</h1>
        <p className="text-gray-600 dark:text-gray-400">Location: {location.slug}</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Departments</h2>
        <ul className="space-y-2">
          {(departments ?? []).map((d: { id: string; name: string }) => (
            <li key={d.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {d.name}
            </li>
          ))}
        </ul>
        {(!departments || departments.length === 0) && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No departments yet.</p>
        )}
      </section>

      {usage && usage.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Usage</h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Metric</th>
                  <th className="text-right p-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((row: { period_date: string; metric_name: string; metric_value: number }) => (
                  <tr key={`${row.period_date}-${row.metric_name}`} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="p-3">{row.period_date}</td>
                    <td className="p-3">{row.metric_name}</td>
                    <td className="p-3 text-right">{Number(row.metric_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
