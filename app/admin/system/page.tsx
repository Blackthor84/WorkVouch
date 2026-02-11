import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SystemPanelClient } from "@/components/admin/system-panel-client";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const profile = await getCurrentUserProfile();
  const roles = await getCurrentUserRoles();
  const role = profile?.role ?? roles[0] ?? null;
  if (!isSuperAdmin(role) && !roles.includes("superadmin")) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 ">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" href="/admin">← Admin</Button>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">System Panel</h1>
        <p className="text-slate-300">Superadmin only: intelligence version, maintenance, DB health, jobs, parity.</p>
      </div>
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">Quick links</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" href="/admin/system/parity" asChild>
            <Link href="/admin/system/parity">Sandbox vs production parity</Link>
          </Button>
        </div>
      </Card>
      <SystemPanelClient />
    </div>
  );
}
