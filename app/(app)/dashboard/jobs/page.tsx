import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Redirect /dashboard/jobs to /profile where Job History is shown.
 * Prevents 404 when users click "Job History" from legacy links.
 */
export default async function DashboardJobsPage() {
  redirect("/profile");
}
