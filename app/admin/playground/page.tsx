import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPlaygroundClient } from "@/components/admin/AdminPlaygroundClient";

export const dynamic = "force-dynamic";

export default async function AdminPlaygroundPage() {
  const admin = await getAdminContext();
  if (!admin.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Playground</h1>
        <p className="text-slate-600 mt-1">Generate scenarios, toggle playground mode, run simulations.</p>
      </div>
      <AdminPlaygroundClient isAdmin={admin.isAdmin} />
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/sandbox-v2"><Button variant="outline" size="sm">Sandbox V2</Button></Link>
        <Link href="/admin/sandbox-v2/population-generator"><Button variant="outline" size="sm">Population Generator</Button></Link>
        <Link href="/admin/sandbox-v2/redteam"><Button variant="outline" size="sm">Red-Team</Button></Link>
      </div>
    </div>
  );
}
