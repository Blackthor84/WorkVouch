/**
 * WorkVouch Network Analytics — trust_events metrics (admin-only).
 * Protected by admin layout + admin email check.
 */

import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { VerificationTrendChart } from "@/components/admin/VerificationTrendChart";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ADMIN_ANALYTICS_EMAIL = "admin@workvouch.com";

type TrustEventRow = { event_type: string; created_at: string };

async function getNetworkMetrics() {
  const sb = getSupabaseServer();
  const { data: rows, error } = await sb
    .from("trust_events")
    .select("event_type, created_at");

  if (error) {
    console.error("[admin/analytics/network] trust_events", error);
    return {
      requestsSent: 0,
      confirmed: 0,
      verificationRate: 0,
      trendData: [] as { date: string; count: number }[],
    };
  }

  const list = (rows ?? []) as unknown as TrustEventRow[];
  const requestsSent = list.filter(
    (r) =>
      r.event_type === "verification_request_sent" ||
      r.event_type === "verification_request"
  ).length;
  const confirmed = list.filter(
    (r) =>
      r.event_type === "coworker_verified" ||
      r.event_type === "coworker_verification_confirmed"
  ).length;
  const verificationRate =
    requestsSent > 0 ? Math.round((confirmed / requestsSent) * 100) : 0;

  // Last 30 days for trend (coworker_verified)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const iso = thirtyDaysAgo.toISOString().slice(0, 10);
  const trendEvents = list.filter(
    (r) =>
      (r.event_type === "coworker_verified" ||
        r.event_type === "coworker_verification_confirmed") &&
      r.created_at >= iso
  );
  const byDay: Record<string, number> = {};
  trendEvents.forEach((e) => {
    const day = e.created_at.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  });
  const trendData = Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    requestsSent,
    confirmed,
    verificationRate,
    trendData,
  };
}

export default async function WorkVouchNetworkAnalyticsPage() {
  const admin = await getAdminContext();
  if (!admin.isAuthenticated) redirect("/login");
  const email = (admin.email ?? "").trim().toLowerCase();
  if (email !== ADMIN_ANALYTICS_EMAIL) redirect("/");

  const metrics = await getNetworkMetrics();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/analytics">
          <Button variant="ghost" size="sm">
            ← Analytics
          </Button>
        </Link>
      </div>
      <h2 className="text-2xl font-bold text-[#0F172A] dark:text-gray-100">
        WorkVouch Network Analytics
      </h2>
      <p className="text-sm text-[#334155] dark:text-gray-400">
        Core metrics from trust_events. Future: average network depth, confirmations per job, dispute rate, trust score distribution.
      </p>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Requests Sent
          </p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A] dark:text-gray-100">
            {metrics.requestsSent}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Confirmed
          </p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A] dark:text-gray-100">
            {metrics.confirmed}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Verification Rate %
          </p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A] dark:text-gray-100">
            {metrics.verificationRate}%
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold text-[#0F172A] dark:text-gray-100">
          Verification growth (last 30 days)
        </h3>
        <VerificationTrendChart initialData={metrics.trendData} />
      </section>
    </div>
  );
}
