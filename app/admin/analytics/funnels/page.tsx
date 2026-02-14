import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";

export const dynamic = "force-dynamic";

export default function AnalyticsFunnelsPage() {
  return <AdminAnalyticsDashboard initialTab="funnels" />;
}
