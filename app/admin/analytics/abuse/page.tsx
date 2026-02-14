import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";

export const dynamic = "force-dynamic";

export default function AnalyticsAbusePage() {
  return <AdminAnalyticsDashboard initialTab="abuse" />;
}
