import { WarehouseOnboardingWrapper } from "./warehouse-onboarding-wrapper";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getSupabaseSession } from "@/lib/supabase/server";

// Mark as dynamic to prevent build-time prerendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WarehouseOnboardingPage() {
  const { session } = await getSupabaseSession();

  if (!session?.user) {
    console.log("REDIRECT TRIGGERED IN: app/(app)/onboarding/warehouse/page.tsx");
    redirect("/login");
  }

  const userId = session.user.id;

  // Check if user's industry is warehousing
  const supabase = await createServerSupabase();
  const supabaseAny = supabase as any;
  const { data: profile, error } = await supabaseAny
    .from("profiles")
    .select("industry")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error loading profile:", error);
  }

  type ProfileRow = { industry: string | null };
  const profileTyped = profile as ProfileRow | null;

  if (!profileTyped || profileTyped.industry !== "warehousing") {
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
