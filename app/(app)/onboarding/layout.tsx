import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * All /onboarding/* routes: admins must never see onboarding — redirect to admin.
 * Uses getAdminContext so admins without a profile row (app_metadata.role) are still redirected.
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminContext();
  if (admin.isAdmin) {
    redirect("/admin");
  }
  return <>{children}</>;
}
