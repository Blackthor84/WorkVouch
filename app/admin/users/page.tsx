import { redirect } from "next/navigation";

import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const admin = await getAdminContext();
  if (!admin.isAuthenticated) redirect("/login");
  if (!admin.isSuperAdmin) redirect("/admin");

  return (
    <div className="mx-auto max-w-7xl p-6 sm:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-600 mt-2">Search, roles, and trust — super admin.</p>
      </div>

      <AdminUsersTable />
    </div>
  );
}
