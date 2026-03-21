import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { EmployerGuidanceShell } from "@/components/guidance/EmployerGuidanceShell";
import { getEffectiveSession } from "@/lib/auth/actingUser";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";

/**
 * Employer portal — employer role only (no employee or admin UI).
 */
export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const session = await getEffectiveSession();
  const effectiveUserId = session?.effectiveUserId ?? user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", effectiveUserId)
    .maybeSingle();

  if (!session?.isImpersonating) {
    const resolved = resolveUserRole({
      role: (profile as { role?: string | null } | null)?.role,
    });
    if (resolved === "pending") {
      redirect("/choose-role");
    }
    if (resolved === "super_admin") {
      redirect("/admin");
    }
    if (resolved === "employee") {
      redirect("/dashboard");
    }
  }

  return (
    <main className="flex-1 bg-background dark:bg-[#0D1117] min-h-screen relative">
      <EmployerGuidanceShell />
      <OnboardingProvider>{children}</OnboardingProvider>
    </main>
  );
}
