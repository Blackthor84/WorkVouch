import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Redirect /dashboard/jobs to /profile where Job History is shown.
 * Prevents 404 when users click "Job History" from legacy links.
 */
export default async function DashboardJobsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  redirect("/profile");
}
