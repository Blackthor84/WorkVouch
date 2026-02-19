import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import AdminReputationEngineClient from "@/components/admin/AdminReputationEngineClient";

export const dynamic = "force-dynamic";

export default async function ReputationEnginePage() {
  const admin = await getAdminContext();
  if (!admin.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Reputation Engine</h1>
        <p className="text-slate-600 mt-1">Adjust weights, preview impact.</p>
      </div>
      <AdminReputationEngineClient />
    </div>
  );
}
