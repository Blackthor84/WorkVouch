export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getTrustOverview } from "@/lib/actions/trustOverview";
import DashboardClient from "./DashboardClient";

export default async function Page() {
  const initialTrustOverview = await getTrustOverview();
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient initialTrustOverview={initialTrustOverview} />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 h-24 animate-pulse rounded-2xl bg-slate-200" />
      <div className="mb-8 h-64 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}
