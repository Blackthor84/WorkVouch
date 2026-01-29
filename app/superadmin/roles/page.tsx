import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth";
import { RoleManager } from "@/components/superadmin/role-manager";

export default async function RoleManagerPage() {
  const superAdmin = await isSuperAdmin();

  if (!superAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-2">
          Superadmin Role Manager
        </h1>
        <p className="text-grey-medium dark:text-gray-400">
          Promote or demote users to different roles
        </p>
      </div>

      <RoleManager />
    </div>
  );
}
