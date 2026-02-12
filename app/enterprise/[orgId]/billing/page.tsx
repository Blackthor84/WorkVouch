import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";

export const dynamic = "force-dynamic";

export default async function BillingPage({ params }: { params: Promise<{ orgId: string }> }) {
  await requireEnterpriseOwner((await params).orgId);
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">Plan type and usage. Recruiters cannot edit billing.</p>
    </div>
  );
}
