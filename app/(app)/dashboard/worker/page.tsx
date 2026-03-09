export const dynamic = "force-dynamic";

import { getUser } from "@/lib/auth/getUser";
import { admin } from "@/lib/supabase-admin";
import WorkerDashboard from "./WorkerDashboardClient";

// Auth and role are enforced by (app)/layout.tsx — no redirect here.
export default async function WorkerDashboardPage() {
  const user = await getUser();
  if (!user) return null;

  let confidenceScore = 0;
  let publicSlug: string | null = null;
  try {
    const [scoreRes, profileRes] = await Promise.all([
      (admin as any)
        .from("user_confidence_scores")
        .select("confidence_score")
        .eq("user_id", user.id)
        .maybeSingle(),
      (admin as any)
        .from("profiles")
        .select("public_slug")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    confidenceScore = Number((scoreRes.data as { confidence_score?: number } | null)?.confidence_score ?? 0);
    publicSlug = (profileRes.data as { public_slug?: string | null } | null)?.public_slug ?? null;
  } catch {
    // view may not exist or query failed
  }

  return (
    <WorkerDashboard
      initialConfidenceScore={confidenceScore}
      publicSlug={publicSlug}
    />
  );
}
