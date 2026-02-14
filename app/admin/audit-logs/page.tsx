import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuditLogsClient } from "@/components/admin/AuditLogsClient";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin"><Button variant="ghost" size="sm">← Back to Admin</Button></Link>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Audit logs</h1>
        <p className="text-[#334155]">Read-only. Export via Admin → Export.</p>
      </div>
      <AuditLogsClient />
    </div>
  );
}
