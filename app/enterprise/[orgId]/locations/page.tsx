import Link from "next/link";
import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEnvironmentForServer } from "@/lib/app-mode";
import { headers, cookies } from "next/headers";
import { WvPageHeader, WvCard, WvButton } from "@/components/wv";

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
  const supabase = await createServerSupabaseClient();

  const { data: locations, error } = await supabase
    .from("locations")
    .select("id, name, city, state")
    .eq("organization_id", orgId)
    .order("name");

  if (error) {
    console.error("[LOCATIONS_FETCH_ERROR]", error);
    return <div className="text-wv-muted">Failed to load locations.</div>;
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
    const ids = (empIds ?? []).map((e: { id: string }) => e.id);
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
    <div className="max-w-5xl space-y-6">
      <WvPageHeader
        eyebrow="Organization"
        title="Locations"
        description="Sub-accounts and sites under your enterprise organization."
        action={<WvButton href={`/enterprise/${orgId}/locations/new`} size="sm">Add location</WvButton>}
      />
      {safeLocations.length === 0 ? (
        <WvCard className="text-center py-8">
          <p className="text-wv-muted">No locations yet. Add one to get started.</p>
        </WvCard>
      ) : (
        <WvCard padding="none" className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-wv-border bg-wv-surface/80">
                <th className="text-left p-3 text-wv-foreground font-semibold">Location Name</th>
                <th className="text-left p-3 text-wv-foreground font-semibold">State</th>
                <th className="text-right p-3 text-wv-foreground font-semibold">Employees</th>
                <th className="text-right p-3 text-wv-foreground font-semibold">References</th>
                <th className="text-left p-3 text-wv-foreground font-semibold">Activity</th>
              </tr>
            </thead>
            <tbody>
              {safeLocations.map((loc) => (
                <tr key={loc.id} className="border-b border-wv-border/50">
                  <td className="p-3">
                    <Link
                      href={`/enterprise/${orgId}/locations/${loc.id}`}
                      className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {loc.name}
                    </Link>
                  </td>
                  <td className="p-3 text-wv-muted">{loc.state ?? "—"}</td>
                  <td className="p-3 text-right text-wv-muted">{employeeCounts[loc.id] ?? 0}</td>
                  <td className="p-3 text-right text-wv-muted">{refCounts[loc.id] ?? 0}</td>
                  <td className="p-3 text-wv-muted">Active</td>
                </tr>
              ))}
            </tbody>
          </table>
        </WvCard>
      )}
    </div>
  );
}
