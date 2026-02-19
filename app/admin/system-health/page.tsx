import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminSystemHealthClient } from "@/components/admin/AdminSystemHealthClient";

export const dynamic = "force-dynamic";

export default async function AdminSystemHealthPage() {
  const admin = await getAdminContext();
  if (!admin.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">System Health</h1>
      <p className="text-slate-600 mb-6">Error rates and system metrics.</p>
      <AdminSystemHealthClient />
    </div>
  );
}
