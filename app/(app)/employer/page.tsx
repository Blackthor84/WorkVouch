import { createClient } from "@/lib/supabase/server";
import { getEmployerDashboardStats } from "@/lib/actions/employer/employerDashboardStats";
import { EmployerDashboardClient } from "./EmployerDashboardClient";

export const dynamic = "force-dynamic";

export default async function EmployerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const stats = await getEmployerDashboardStats();

  return (
    <EmployerDashboardClient
      initialStats={
        stats ?? {
          candidatesViewedToday: 0,
          avgTrustScoreViewed: 0,
          savedCandidatesCount: 0,
          isHiringPremium: false,
          profileViewsRemaining: 5,
        }
      }
    />
  );
}
