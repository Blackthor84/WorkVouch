import { NavbarServer } from "@/components/navbar-server";
import { WarehouseOnboardingWrapper } from "./warehouse-onboarding-wrapper";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Mark as dynamic to prevent build-time prerendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WarehouseOnboardingPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Check if user's industry is warehousing
  const supabaseAny = supabase as any;
  const { data: profile, error } = await supabaseAny
    .from("profiles")
    .select("industry")
    .eq("id", user.id)
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
    <>
      <NavbarServer />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <WarehouseOnboardingWrapper userId={user.id} />
        </div>
      </main>
    </>
  );
}
