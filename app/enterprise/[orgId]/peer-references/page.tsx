import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";

export const dynamic = "force-dynamic";

export default async function PeerReferencesPage({ params }: { params: Promise<{ orgId: string }> }) {
  await requireEnterpriseOwner((await params).orgId);
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Peer References</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">View all peer references across the organization. Same visibility rules as production.</p>
    </div>
  );
}
