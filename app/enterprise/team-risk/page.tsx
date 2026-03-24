import nextDynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";

const TeamRiskClient = nextDynamic(
  () => import("@/components/enterprise/TeamRiskClient").then((m) => ({ default: m.TeamRiskClient })),
  {
    loading: () => (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500 text-sm">Loading team view…</div>
    ),
  }
);

export const dynamic = "force-dynamic";

export default async function EnterpriseTeamRiskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return <TeamRiskClient />;
}
