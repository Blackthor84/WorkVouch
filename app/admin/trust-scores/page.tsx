import { getAdminContext } from "@/lib/admin/getAdminContext";

export const dynamic = "force-dynamic";

/**
 * Trust Scores admin: manually adjust, lock, view. Guarded by admin layout.
 */
export default async function AdminTrustScoresPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) return null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Trust Scores</h1>
      <p className="text-sm text-slate-600 mb-4">
        View and moderate trust scores. Use user detail pages for per-user adjustments.
      </p>
      <ul className="list-disc ml-6 space-y-1 text-slate-700">
        <li>Manual adjust trust score (with reason) — via user detail or API</li>
        <li>Lock trust score (freeze) — via user detail or API</li>
        <li>All actions are audited and respect sandbox mode.</li>
      </ul>
    </div>
  );
}
