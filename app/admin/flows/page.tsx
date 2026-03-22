import Link from "next/link";
import { FlowViewerClient } from "@/components/admin/flow-viewer/FlowViewerClient";

export const dynamic = "force-dynamic";

/**
 * Internal product / debugging tool — not user-facing.
 * Guarded by admin layout (admin_users + role).
 */
export default function AdminFlowViewerPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/admin" className="text-sm font-medium text-blue-600 hover:underline">
          ← Admin home
        </Link>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          Internal only · static previews
        </div>
      </div>

      <FlowViewerClient />
    </div>
  );
}
