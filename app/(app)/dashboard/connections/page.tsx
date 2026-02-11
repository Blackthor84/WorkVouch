import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Redirect /dashboard/connections to /coworker-matches.
 * Prevents 404 when users click Connections from legacy sidebar links.
 */
export default async function DashboardConnectionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  redirect("/coworker-matches");
}
