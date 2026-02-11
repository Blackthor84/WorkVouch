import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const EXPORT_TYPES = [
  { type: "users", label: "Export all users", filename: "users.csv" },
  { type: "peer_reviews", label: "Export all peer reviews", filename: "peer_reviews.csv" },
  { type: "fraud_flags", label: "Export fraud flags", filename: "fraud_signals.csv" },
  { type: "employment", label: "Export employment data", filename: "employment_records.csv" },
  { type: "audit_logs", label: "Export audit logs", filename: "audit_logs.csv" },
];

export default async function AdminExportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const profile = await getCurrentUserProfile();
  const roles = await getCurrentUserRoles();
  const role = profile?.role ?? roles[0] ?? null;
  if (!isAdmin(role) && !roles.some((r) => isAdmin(r))) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-200 mb-2">Data Export & Compliance</h1>
        <p className="text-slate-300">Generate CSV exports. Admin only.</p>
      </div>
      <Card className="p-6">
        <ul className="space-y-3">
          {EXPORT_TYPES.map(({ type, label, filename }) => (
            <li key={type} className="flex items-center justify-between gap-4 border-b border-grey-background dark:border-[#374151] pb-3 last:border-0">
              <span className="text-slate-200">{label}</span>
              <a href={`/api/admin/export?type=${type}`} className="inline-flex items-center justify-center px-5 py-2.5 text-base font-semibold rounded-xl border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A1F2B] transition-colors">
                Download CSV
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
