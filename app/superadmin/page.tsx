import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import { NavbarServer } from "@/components/navbar-server";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default async function SuperAdminPanel() {
  const superAdmin = await isSuperAdmin();

  if (!superAdmin) {
    redirect("/dashboard");
  }

  return (
    <>
      <NavbarServer />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-6">
          Superadmin Control
        </h1>
        <p className="text-grey-medium dark:text-gray-400 mb-6">
          Full system access and role management
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-red-500">
            <Link href="/superadmin/roles" className="block">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                Manage User Roles
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Promote or demote users to different roles
              </p>
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
