import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminSubscriptionsClient } from "@/components/admin/AdminSubscriptionsClient";

export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  const admin = await getAdminContext();
  if (!admin.isSuperAdmin) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin"><Button variant="ghost" size="sm">← Overview</Button></Link>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Revenue</h1>
      <p className="text-slate-600 mb-6">Stripe and finance aggregates.</p>
      <AdminSubscriptionsClient />
      <p className="mt-4 text-sm text-slate-500"><Link href="/admin/financials" className="text-blue-600 hover:underline">Financials</Link></p>
    </div>
  );
}
