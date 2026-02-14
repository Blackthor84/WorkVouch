import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";

export const dynamic = "force-dynamic";

export default function AnalyticsRealtimePage() {
  return <AdminAnalyticsDashboard initialTab="realtime" />;
}
