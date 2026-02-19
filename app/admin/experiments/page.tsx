import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminExperimentsClient } from "@/components/admin/AdminExperimentsClient";

export const dynamic = "force-dynamic";

export default async function AdminExperimentsPage() {
  const admin = await getAdminContext();
  if (!admin.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Experiments</h1>
        <p className="text-slate-600 mt-1">Feature flags and rollout.</p>
      </div>
      <AdminExperimentsClient />
    </div>
  );
}
