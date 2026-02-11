import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmployerUsageClient } from "@/components/admin/EmployerUsageClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminEmployerUsagePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const roles = (session.user as { roles?: string[] }).roles || [];
  const isAdmin = roles.includes("admin") || roles.includes("superadmin");
  if (!isAdmin) {
    redirect("/dashboard");
  }
  const isSuperAdmin = roles.includes("superadmin");

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
