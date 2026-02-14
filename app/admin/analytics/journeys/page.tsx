import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";

export const dynamic = "force-dynamic";

export default function AnalyticsJourneysPage() {
  return <AdminAnalyticsDashboard initialTab="journeys" />;
}
