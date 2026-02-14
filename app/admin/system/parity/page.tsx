import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ParityReportClient } from "@/components/admin/parity-report-client";

export const dynamic = "force-dynamic";

export default async function AdminSystemParityPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin || !admin.isSuperAdmin) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 ">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" href="/admin/system" asChild>
          <Link href="/admin/system">← System</Link>
        </Button>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Production Parity Validator</h1>
        <p className="text-[#334155]">Compare sandbox scoring vs production scoring; version mismatch detection; report drift.</p>
      </div>
      <ParityReportClient />
    </div>
  );
}
