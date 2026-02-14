import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";

export const dynamic = "force-dynamic";

export default function AnalyticsOverviewPage() {
  return <AdminAnalyticsDashboard initialTab="overview" />;
}
