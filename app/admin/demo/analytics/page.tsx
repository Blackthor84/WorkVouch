import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import AdminDemoAnalyticsClient from "./admin-demo-analytics-client";

export const dynamic = "force-dynamic";

export default async function AdminDemoAnalyticsPage() {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as { roles?: string[] })?.roles ?? [];
  if (!roles.includes("admin") && !roles.includes("superadmin")) {
    redirect("/dashboard");
  }
  return <AdminDemoAnalyticsClient />;
}
