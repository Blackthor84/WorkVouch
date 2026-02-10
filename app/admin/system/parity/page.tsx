import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ParityReportClient } from "@/components/admin/parity-report-client";

export const dynamic = "force-dynamic";

export default async function AdminSystemParityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const profile = await getCurrentUserProfile();
  const roles = await getCurrentUserRoles();
  const role = profile?.role ?? roles[0] ?? null;
  if (!isSuperAdmin(role) && !roles.includes("superadmin")) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" href="/admin/system" asChild>
          <Link href="/admin/system">← System</Link>
        </Button>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">Production Parity Validator</h1>
        <p className="text-grey-medium dark:text-gray-400">Compare sandbox scoring vs production scoring; version mismatch detection; report drift.</p>
      </div>
      <ParityReportClient />
    </div>
  );
}
