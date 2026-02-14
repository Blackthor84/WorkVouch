import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const admin = await getAdminContext();
  if (!admin.isAdmin) redirect("/dashboard");
  redirect("/admin/analytics/overview");
}
