import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Redirect /dashboard/connections to /coworker-matches.
 * Prevents 404 when users click Connections from legacy sidebar links.
 */
export default async function DashboardConnectionsPage() {
  redirect("/coworker-matches");
}
