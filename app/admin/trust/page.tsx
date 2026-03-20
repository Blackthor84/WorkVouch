import { redirect } from "next/navigation";

import { getAdminContext } from "@/lib/admin/getAdminContext";
import { TrustCenterClient } from "@/components/admin/TrustCenterClient";

export const dynamic = "force-dynamic";

export default async function AdminTrustPage() {
  const admin = await getAdminContext();
  if (!admin.isAuthenticated) redirect("/login");
  if (!admin.isSuperAdmin) redirect("/admin");

  return (
    <div className="mx-auto max-w-7xl p-6 sm:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Trust system</h1>
        <p className="text-slate-600 mt-2">Distribution, outliers, and recalculation tools.</p>
      </div>
      <TrustCenterClient />
    </div>
  );
}
