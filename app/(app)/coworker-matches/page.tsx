export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getLeaderboard } from "@/lib/actions/leaderboard";
import CoworkerMatchesClient from "./CoworkerMatchesClient";

export default async function Page() {
  const leaderboard = await getLeaderboard(10);
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <CoworkerMatchesClient initialLeaderboard={leaderboard} />
    </Suspense>
  );
}
