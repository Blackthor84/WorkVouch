import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SystemPanelClient } from "@/components/admin/system-panel-client";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
  const ctx = await getAdminContext();
  if (!ctx.authorized || !ctx.isSuperAdmin) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 ">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" href="/admin">← Admin</Button>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">System Panel</h1>
        <p className="text-[#334155]">Superadmin only: intelligence version, maintenance, DB health, jobs, parity.</p>
      </div>
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Quick links</h2>
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
