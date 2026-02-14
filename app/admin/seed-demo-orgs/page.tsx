import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SeedDemoOrgsClient } from "@/components/admin/SeedDemoOrgsClient";

export const dynamic = "force-dynamic";

export default async function AdminSeedDemoOrgsPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin || !admin.isSuperAdmin) redirect("/admin");

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin"><Button variant="ghost" size="sm">← Back to Admin</Button></Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Re-seed demo orgs</h1>
        <p className="text-[#334155] text-sm">Sandbox only. Creates 3 demo orgs (mode=sandbox, demo=true).</p>
      </div>
      <SeedDemoOrgsClient />
    </div>
  );
}
