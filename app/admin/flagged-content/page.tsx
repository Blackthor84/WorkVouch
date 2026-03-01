import { requireAdmin } from "@/lib/admin/requireAdmin";
import { FlaggedContentClient } from "./FlaggedContentClient";

export const dynamic = "force-dynamic";

/**
 * Flagged Content moderation queue. Admin-only; layout also enforces admin.
 */
export default async function FlaggedContentPage() {
  await requireAdmin();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[#0F172A] mb-2">Flagged Content</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Review and resolve flags on references and reviews. All actions are audit-logged.
      </p>
      <FlaggedContentClient />
    </div>
  );
}
