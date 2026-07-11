import { requireEnterpriseOwner } from "@/lib/enterprise/requireEnterprise";
import { WvPageHeader } from "@/components/wv";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({ params }: { params: Promise<{ orgId: string }> }) {
  await requireEnterpriseOwner((await params).orgId);
  return (
    <div className="max-w-4xl space-y-6">
      <WvPageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Total references written, completion rate, cross-location transfers, most active departments, and growth over time."
      />
    </div>
  );
}
