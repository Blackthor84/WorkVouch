import { requireAdmin } from "@/lib/auth/requireAdmin";
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
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Data Export & Compliance</h1>
        <p className="text-[#334155]">Generate CSV exports. Admin only.</p>
      </div>
      <Card className="p-6">
        <ul className="space-y-3">
          {EXPORT_TYPES.map(({ type, label }) => (
            <li key={type} className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] pb-3 last:border-0">
              <span className="text-[#334155]">{label}</span>
              <a href={`/api/admin/export?type=${type}`} className="inline-flex items-center justify-center px-5 py-2.5 text-base font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#334155] hover:bg-slate-50 transition-colors">
                Download CSV
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
