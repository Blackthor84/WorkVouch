import Link from "next/link";
import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getEnvironmentForServer } from "@/lib/app-mode";
import { headers, cookies } from "next/headers";

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
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employees</h1>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Location</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(employees ?? []).map((emp) => (
              <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-3">
                  <Link href={`/enterprise/${orgId}/employees/${emp.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {emp.full_name}
                  </Link>
                </td>
                <td className="p-3">{emp.location_id ? locMap.get(emp.location_id) ?? "—" : "—"}</td>
                <td className="p-3">{emp.invite_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
