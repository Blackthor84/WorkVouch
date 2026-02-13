import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { ScaleMetricsClient } from "./ScaleMetricsClient";

export const dynamic = "force-dynamic";

export default async function ScaleMetricsPage() {
  const ctx = await getAdminContext();
  if (!ctx.authorized || !ctx.isSuperAdmin) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Scale Metrics</h1>
      <p className="text-slate-600 mb-6">
        Read-only view: orgs at limit, blocked actions by plan, abuse flags. Super admin only.
      </p>
      <ScaleMetricsClient />
    </div>
  );
}
