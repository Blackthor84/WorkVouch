import Link from "next/link";
import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { createServerSupabase } from "@/lib/supabase/server";
import { getEnvironmentForServer } from "@/lib/app-mode";
import { headers, cookies } from "next/headers";

export const dynamic = "force-dynamic";

type Location = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
};

export default async function EnterpriseLocationsPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireEnterpriseOwner(orgId);
  const h = await headers();
  const c = await cookies();
  const env = getEnvironmentForServer(h, c);
  const supabase = await createServerSupabase();

  const { data: locations, error } = await supabase
    .from("locations")
    .select("id, name, city, state")
    .eq("organization_id", orgId)
    .order("name");

  if (error) {
    console.error("[LOCATIONS_FETCH_ERROR]", error);
    return <div>Failed to load locations.</div>;
  }

  const safeLocations: Location[] = locations ?? [];
  const locationIds = safeLocations.map((l) => l.id);

  const employeeCounts: Record<string, number> = {};
  const refCounts: Record<string, number> = {};
  for (const loc of locationIds) {
    const { count } = await supabase
      .from("workforce_employees")
      .select("id", { count: "exact", head: true })
      .eq("location_id", loc)
      .eq("environment", env);
    employeeCounts[loc] = count ?? 0;
    const { data: empIds } = await supabase
      .from("workforce_employees")
      .select("id")
      .eq("location_id", loc)
      .eq("environment", env);
    const ids = (empIds ?? []).map((e) => e.id);
    if (ids.length === 0) {
      refCounts[loc] = 0;
    } else {
      const { count: refCount } = await supabase
        .from("workforce_peer_references")
        .select("id", { count: "exact", head: true })
        .eq("environment", env)
        .in("employee_id", ids);
      refCounts[loc] = refCount ?? 0;
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Locations</h1>
        <Link
          href={`/enterprise/${orgId}/locations/new`}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          Add location
        </Link>
      </div>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-3">Location Name</th>
              <th className="text-left p-3">City / State</th>
              <th className="text-right p-3">Employees</th>
              <th className="text-right p-3">References</th>
              <th className="text-left p-3">Activity</th>
            </tr>
          </thead>
          <tbody>
            {safeLocations.map((loc) => (
              <tr key={loc.id} className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-3">
                  <Link href={`/enterprise/${orgId}/locations/${loc.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {loc.name}
                  </Link>
                </td>
                <td className="p-3 text-gray-600 dark:text-gray-400">
                  {[loc.city, loc.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="p-3 text-right">{employeeCounts[loc.id] ?? 0}</td>
                <td className="p-3 text-right">{refCounts[loc.id] ?? 0}</td>
                <td className="p-3 text-gray-500">Active</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {safeLocations.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No locations yet. Add one above.</p>
      )}
    </div>
  );
}
