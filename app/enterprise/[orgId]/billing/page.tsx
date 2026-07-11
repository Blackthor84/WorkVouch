import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { WvPageHeader } from "@/components/wv";

export const dynamic = "force-dynamic";

export default async function BillingPage({ params }: { params: Promise<{ orgId: string }> }) {
  await requireEnterpriseOwner((await params).orgId);
  return (
    <div className="max-w-4xl space-y-6">
      <WvPageHeader
        eyebrow="Account"
        title="Billing"
        description="Plan type and usage. Recruiters cannot edit billing."
      />
    </div>
  );
}
