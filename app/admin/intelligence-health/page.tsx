import { requireAdmin } from "@/lib/admin/requireAdmin";
import { AdminIntelligenceHealthClient } from "./AdminIntelligenceHealthClient";

export const dynamic = "force-dynamic";

export default async function AdminIntelligenceHealthPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Integrity Health Dashboard</h1>
      <p className="text-[#334155] mb-6">
        Monitoring: % profiles recalculated successfully, fraud blocks per day,
        average sentiment shift, overlap validation failures.
      </p>
      <AdminIntelligenceHealthClient />
    </div>
  );
}
