import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { NavbarServer } from "@/components/navbar-server";
import { AdminUsersList } from "@/components/admin/users-list";

export default async function AdminUsers() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const isAdmin = session.user.role === "admin" || session.user.roles?.includes("admin") || session.user.roles?.includes("superadmin");
  
  if (!isAdmin) {
    redirect("/auth/signin");
  }

  return (
    <>
      <NavbarServer />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
            All Users
          </h1>
          <p className="text-grey-medium dark:text-gray-400">
            View and manage all user accounts
          </p>
        </div>

        <AdminUsersList />
      </div>
    </>
  );
}
