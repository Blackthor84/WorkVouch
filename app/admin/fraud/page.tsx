import { requireAdmin } from "@/lib/auth/requireAdmin";
import { FraudDashboardClient } from "@/components/admin/fraud-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminFraudPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Fraud Detection Dashboard</h1>
        <p className="text-[#334155]">
          Self-review blocks, duplicate reviews, overlap failures, rapid velocity, multi-account, sentiment spikes, rehire manipulation, mass negative patterns. Click a row to open user forensics.
        </p>
      </div>
      <FraudDashboardClient />
    </div>
  );
}
