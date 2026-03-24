import nextDynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";

const HiringIntelligenceDashboardClient = nextDynamic(
  () =>
    import("@/components/enterprise/HiringIntelligenceDashboardClient").then((m) => ({
      default: m.HiringIntelligenceDashboardClient,
    })),
  {
    loading: () => (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">Loading dashboard…</div>
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

  return <HiringIntelligenceDashboardClient />;
}
