export const dynamic = "force-dynamic";

import { getUser } from "@/lib/auth/getUser";
import { redirect } from "next/navigation";
import { admin } from "@/lib/supabase-admin";
import WorkerDashboard from "./WorkerDashboardClient";

export default async function WorkerDashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  let confidenceScore = 0;
  try {
    const { data } = await (admin as any)
      .from("user_confidence_scores")
      .select("confidence_score")
      .eq("user_id", user.id)
      .maybeSingle();
    confidenceScore = Number((data as { confidence_score?: number } | null)?.confidence_score ?? 0);
  } catch {
    // view may not exist or query failed
  }

  return <WorkerDashboard initialConfidenceScore={confidenceScore} />;
}
