import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Canonical onboarding entry. Admins must never see onboarding — redirect to admin.
 * Non-admins are sent to dashboard where the onboarding overlay can show.
 */
export default async function OnboardingPage() {
  const admin = await getAdminContext();
  if (admin.isAdmin) {
    redirect("/admin");
  }
  redirect("/dashboard");
}
