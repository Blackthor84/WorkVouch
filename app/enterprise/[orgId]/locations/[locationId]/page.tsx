import Link from "next/link";
import { notFound } from "next/navigation";
import { requireLocationAccess } from "@/lib/enterprise/requireEnterprise";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { WvPageHeader, WvCard } from "@/components/wv";

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
      <Link
        href={`/enterprise/${orgId}`}
        className="text-sm text-blue-400 hover:text-blue-300 hover:underline mb-2 inline-block"
      >
        ← {org?.name ?? "Organization"}
      </Link>
      <WvPageHeader title={location.name} description={`Location: ${location.slug}`} />

      <section>
        <h2 className="text-lg font-semibold text-wv-foreground mb-3">Departments</h2>
        <ul className="space-y-2">
          {(departments ?? []).map((d: { id: string; name: string }) => (
            <li key={d.id}>
              <WvCard padding="sm">{d.name}</WvCard>
            </li>
          ))}
        </ul>
        {(!departments || departments.length === 0) && (
          <p className="text-wv-muted text-sm">No departments yet.</p>
        )}
      </section>

      {usage && usage.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-wv-foreground mb-3">Usage</h2>
          <WvCard padding="none" className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-wv-border bg-wv-surface/80">
                  <th className="text-left p-3 text-wv-foreground font-semibold">Date</th>
                  <th className="text-left p-3 text-wv-foreground font-semibold">Metric</th>
                  <th className="text-right p-3 text-wv-foreground font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((row: { period_date: string; metric_name: string; metric_value: number }) => (
                  <tr key={`${row.period_date}-${row.metric_name}`} className="border-b border-wv-border/50">
                    <td className="p-3 text-wv-muted">{row.period_date}</td>
                    <td className="p-3 text-wv-muted">{row.metric_name}</td>
                    <td className="p-3 text-right text-wv-foreground">{Number(row.metric_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </WvCard>
        </section>
      )}
    </div>
  );
}
