import nextDynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { EnterprisePortalLayout } from "@/components/enterprise/EnterprisePortalLayout";
import { WvPageHeader } from "@/components/wv";

const HiringIntelligenceDashboardClient = nextDynamic(
  () =>
    import("@/components/enterprise/HiringIntelligenceDashboardClient").then((m) => ({
      default: m.HiringIntelligenceDashboardClient,
    })),
  {
    loading: () => (
      <div className="py-16 text-center text-wv-muted text-sm">Loading dashboard…</div>
    ),
  }
);

export const dynamic = "force-dynamic";

export default async function EnterpriseHiringDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <EnterprisePortalLayout>
      <WvPageHeader
        eyebrow="Intelligence"
        title="Hiring Intelligence Dashboard"
        description="Verified workforce signals, risk indicators, and decision support for enterprise teams."
      />
      <div className="mt-8">
        <HiringIntelligenceDashboardClient />
      </div>
    </EnterprisePortalLayout>
  );
}
