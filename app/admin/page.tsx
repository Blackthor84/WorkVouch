import Link from "next/link";

import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminOverviewClient } from "@/components/admin/AdminOverviewClient";
import { ControlCenterDashboard } from "@/components/admin/ControlCenterDashboard";
import { WvPageHeader, WvCard } from "@/components/wv";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const admin = await getAdminContext();
  if (!admin.isAuthenticated || !admin.isAdmin) {
    return (
      <div className="p-8 text-wv-muted">
        <p>Admin access required.</p>
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
          Go to dashboard
        </Link>
      </div>
    );
  }

  const isControlCenter = admin.isSuperAdmin;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {admin.appEnvironment === "sandbox" && (
        <WvCard className="mb-6 border-amber-500/30 bg-amber-500/10">
          <p className="font-semibold text-amber-200">Sandbox mode</p>
          <p className="text-sm text-amber-200/80">Data may be sandbox-only. No production impact.</p>
        </WvCard>
      )}
      <WvPageHeader
        eyebrow="Admin"
        title={isControlCenter ? "Control center" : "Overview"}
        description={
          isControlCenter
            ? "Platform health, trust, and moderation — super admin only metrics."
            : "Production metrics. Real-time updates every 30s."
        }
      />
      <div className="mt-8">
        {isControlCenter ? <ControlCenterDashboard /> : <AdminOverviewClient />}
      </div>
    </div>
  );
}
