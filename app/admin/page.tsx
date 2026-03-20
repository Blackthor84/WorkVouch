import Link from "next/link";

import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminOverviewClient } from "@/components/admin/AdminOverviewClient";
import { ControlCenterDashboard } from "@/components/admin/ControlCenterDashboard";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const admin = await getAdminContext();
  if (!admin.isAuthenticated || !admin.isAdmin) {
    return (
      <div className="p-8 text-slate-700">
        <p>Admin access required.</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
          Go to dashboard
        </Link>
      </div>
    );
  }

  const isControlCenter = admin.isSuperAdmin;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {admin.appEnvironment === "sandbox" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="font-semibold text-amber-900">Sandbox mode</p>
          <p className="text-sm text-amber-800">Data may be sandbox-only. No production impact.</p>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {isControlCenter ? "Control center" : "Overview"}
        </h1>
        <p className="text-slate-600 mt-2">
          {isControlCenter
            ? "Platform health, trust, and moderation — super admin only metrics."
            : "Production metrics. Real-time updates every 30s."}
        </p>
      </div>
      {isControlCenter ? <ControlCenterDashboard /> : <AdminOverviewClient />}
    </div>
  );
}
