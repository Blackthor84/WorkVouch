import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { AdminUsersList } from "@/components/admin/users-list";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const roles = session.user.roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">All Users</h1>
        <p className="text-[#334155]">View and manage all user accounts</p>
      </div>

      <AdminUsersList />
    </div>
  );
}
