import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";

export const dynamic = "force-dynamic";

export default function AnalyticsSandboxPage() {
  return (
    <div className="rounded-lg border-2 border-amber-400 bg-amber-50/80 p-4">
      <p className="mb-3 text-sm font-semibold text-amber-900">
        🧪 SANDBOX ANALYTICS — No production data. All data below is sandbox-only.
      </p>
      <AdminAnalyticsDashboard initialTab="overview" forceSandbox />
    </div>
  );
}
