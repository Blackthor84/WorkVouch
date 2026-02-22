import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminUsersList } from "@/components/admin/users-list";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">All Users</h1>
        <p className="text-[#334155]">View and manage all user accounts</p>
      </div>

      <AdminUsersList role={admin.profileRole === "super_admin" ? "superadmin" : admin.profileRole} />
    </div>
  );
}
