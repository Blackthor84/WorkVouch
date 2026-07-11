import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { WvPageHeader } from "@/components/wv";

export const dynamic = "force-dynamic";

export default async function PeerReferencesPage({ params }: { params: Promise<{ orgId: string }> }) {
  await requireEnterpriseOwner((await params).orgId);
  return (
    <div className="max-w-4xl space-y-6">
      <WvPageHeader
        eyebrow="Workforce"
        title="Peer References"
        description="View all peer references across the organization. Same visibility rules as production."
      />
    </div>
  );
}
