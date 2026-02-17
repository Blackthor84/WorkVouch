import { redirect } from "next/navigation";

/**
 * Canonical worker dashboard URL. Redirects to the app route that renders the worker dashboard.
 */
export default function WorkerDashboardPage() {
  redirect("/dashboard/worker");
}
