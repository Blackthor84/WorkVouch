import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Redirect /dashboard/settings to /settings.
 * Prevents 404 when users click Settings from legacy sidebar links.
 */
export default async function DashboardSettingsPage() {
  redirect("/settings");
}
