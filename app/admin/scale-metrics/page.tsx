import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import { ScaleMetricsClient } from "./ScaleMetricsClient";

export const dynamic = "force-dynamic";

export default async function ScaleMetricsPage() {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    redirect("/admin");
  }

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
