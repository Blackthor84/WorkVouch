import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmployerUsageClient } from "@/components/admin/EmployerUsageClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminEmployerUsagePage() {
  const ctx = await getAdminContext();
  if (!ctx.authorized) redirect("/login");
  const isSuperAdmin = ctx.isSuperAdmin;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="sm">← Back to Admin</Button>
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Employer Usage</h1>
        <p className="text-[#334155]">
          Current plan, Stripe IDs, usage this cycle, overages. Manual override available. Superadmin: override tier, billing cycle, reset usage, add/remove credit.
        </p>
      </div>
      <Card className="p-6 bg-white border border-[#E2E8F0]">
        <EmployerUsageClient isSuperAdmin={isSuperAdmin} />
      </Card>
    </div>
  );
}
