import { requireAdmin } from "@/lib/admin/requireAdmin";
import BetaAccessManager from "@/components/admin/BetaAccessManager";
import { AdminBetaGate } from "@/components/AdminBetaGate";

export default async function AdminBetaPage() {
  await requireAdmin();

  return (
    <AdminBetaGate>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Beta Access Management</h1>
        <p className="text-[#334155]">Create temporary preview access for beta users</p>
      </div>

      <BetaAccessManager />
    </div>
    </AdminBetaGate>
  );
}
