import { WarehouseOnboardingWrapper } from "./warehouse-onboarding-wrapper";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/getAdminContext";

// Mark as dynamic to prevent build-time prerendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WarehouseOnboardingPage() {
  const admin = await getAdminContext();

  if (!admin.isAuthenticated) {
    redirect("/login");
  }

  if (admin.isAdmin) {
    redirect("/admin");
  }

  const userId = admin.userId;
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("profiles")
    .select("role, industry")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return (
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <p>Unable to load profile data.</p>
        </div>
      </main>
    );
  }

  if (data.industry !== "warehousing") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-background dark:bg-[#0D1117]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <WarehouseOnboardingWrapper userId={userId} />
      </div>
    </main>
  );
}
