import Link from "next/link";
import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getEnvironmentForServer } from "@/lib/app-mode";
import { headers, cookies } from "next/headers";
import { WvPageHeader, WvCard } from "@/components/wv";

export const dynamic = "force-dynamic";

export default async function EnterpriseEmployeesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  await requireEnterpriseOwner(orgId);
  const h = await headers();
  const c = await cookies();
  const env = getEnvironmentForServer(h, c);
  const supabase = getSupabaseServer();
  const { data: employees } = await supabase
    .from("workforce_employees")
    .select("id, full_name, email, location_id, invite_status")
    .eq("organization_id", orgId)
    .eq("environment", env)
    .order("full_name");
  const locationIds = [...new Set((employees ?? []).map((e) => e.location_id).filter(Boolean))] as string[];
  const { data: locs } = await supabase.from("locations").select("id, name").in("id", locationIds);
  const locMap = new Map((locs ?? []).map((l) => [l.id, l.name]));

  return (
    <div className="max-w-5xl space-y-6">
      <WvPageHeader
        eyebrow="Workforce"
        title="Employees"
        description="All employees across locations in your organization."
      />
      <WvCard padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-wv-border bg-wv-surface/80">
              <th className="text-left p-3 text-wv-foreground font-semibold">Name</th>
              <th className="text-left p-3 text-wv-foreground font-semibold">Location</th>
              <th className="text-left p-3 text-wv-foreground font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {(employees ?? []).map((emp) => (
              <tr key={emp.id} className="border-b border-wv-border/50">
                <td className="p-3">
                  <Link
                    href={`/enterprise/${orgId}/employees/${emp.id}`}
                    className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {emp.full_name}
                  </Link>
                </td>
                <td className="p-3 text-wv-muted">{emp.location_id ? (locMap.get(emp.location_id) ?? "—") : "—"}</td>
                <td className="p-3 text-wv-muted">{emp.invite_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </WvCard>
    </div>
  );
}
