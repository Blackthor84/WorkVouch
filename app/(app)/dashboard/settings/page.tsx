import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Redirect /dashboard/settings to /settings.
 * Prevents 404 when users click Settings from legacy sidebar links.
 */
export default async function DashboardSettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  redirect("/settings");
}
