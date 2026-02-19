import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminHeatmapsPage() {
  const admin = await getAdminContext();
  if (!admin.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin"><Button variant="ghost" size="sm">← Overview</Button></Link>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Heatmaps</h1>
        <p className="text-slate-600 mt-1">Activity by time, reviews by company, employer searches.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <Link href="/admin/analytics/heatmaps" className="text-blue-600 hover:underline font-medium">Open Analytics Heatmaps →</Link>
        <p className="mt-2 text-sm text-slate-600">Uses production analytics APIs.</p>
      </div>
    </div>
  );
}
