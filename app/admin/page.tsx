import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminOverviewClient } from "@/components/admin/AdminOverviewClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const admin = await getAdminContext();
  if (!admin.isAuthenticated || !admin.isSuperAdmin) {
    return (
      <div className="p-8 text-slate-700">
        <p>Superadmin access required.</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">Go to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {admin.isSandbox && (
        <div className="mb-6 rounded-lg border border-amber-400 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">Sandbox mode</p>
          <p className="text-sm text-amber-800">Data may be sandbox-only. No production impact.</p>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Overview</h1>
        <p className="text-slate-600 mt-1">Production metrics. Real-time updates every 30s.</p>
      </div>
      <AdminOverviewClient />
    </div>
  );
}
