import Link from "next/link";
import { getEnterpriseSession } from "@/lib/enterprise/requireEnterprise";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function EnterpriseOrganizationsPage() {
  const ent = await getEnterpriseSession();
  const isSuperAdmin =
    (await import("@/lib/admin/requireAdmin").then((m) => m.requireAdmin().catch(() => null))) != null;
  const orgIds = isSuperAdmin ? null : ent.enterpriseOwnerOrgIds;

  if (orgIds != null && orgIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Enterprise</h1>
        <p className="text-gray-600 dark:text-gray-400">
          You are not an enterprise owner for any organization. Contact your administrator to get access.
        </p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const supabase = getSupabaseServer();
  let query = supabase
    .from("organizations")
    .select("id, name, slug, billing_tier, created_at")
    .order("name");
  if (orgIds != null) query = query.in("id", orgIds);
  const { data: organizations } = await query;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Organizations</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Organization-level dashboard. Select an organization to manage locations and view usage.
      </p>
      <ul className="space-y-3">
        {(organizations ?? []).map((org: { id: string; name: string; slug: string; billing_tier: string }) => (
          <li key={org.id}>
            <Link
              href={`/enterprise/${org.id}`}
              className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-white">{org.name}</span>
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({org.slug})</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {org.billing_tier}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {(!organizations || organizations.length === 0) && (
        <p className="text-gray-500 dark:text-gray-400">No organizations found.</p>
      )}
    </div>
  );
}
