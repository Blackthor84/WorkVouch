import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

/** Feature flag: show org health placeholder. When false, admin never sees the card. */
const ORG_HEALTH_PLACEHOLDER_FLAG = process.env.NEXT_PUBLIC_ORG_HEALTH_PLACEHOLDER_VISIBLE === "true";

export default async function AdminOrgHealthPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/login");

  if (!ORG_HEALTH_PLACEHOLDER_FLAG) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin"><Button variant="ghost" size="sm">← Back to Admin</Button></Link>
        </div>
        <p className="text-[#64748B]">This section is not available.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin"><Button variant="ghost" size="sm">← Back to Admin</Button></Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Org health</h1>
        <p className="text-[#334155] text-sm">Placeholder. No scoring or UI beyond this card.</p>
      </div>
      <Card className="p-6 border border-[#E2E8F0] bg-slate-50 dark:bg-gray-800/50">
        <p className="text-[#64748B] font-medium">Org health (placeholder)</p>
        <p className="text-sm text-[#64748B] mt-1">Future-proofing only. No scoring logic. No UI yet.</p>
      </Card>
    </div>
  );
}
