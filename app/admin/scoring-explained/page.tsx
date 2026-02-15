import { getAdminContext } from "@/lib/admin/getAdminContext";
import { ScoringExplainedClient } from "./ScoringExplainedClient";

export const dynamic = "force-dynamic";

/**
 * Admin Trust Scoring Explained. Dispute resolution, legal defensibility, enterprise transparency.
 */
export default async function AdminScoringExplainedPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) return null;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Trust Scoring Explained</h1>
      <p className="text-sm text-slate-600 mb-6">
        Canonical formula, component breakdown, and audit-backed history. All score changes require a reason and are logged.
      </p>
      <ScoringExplainedClient />
    </div>
  );
}
