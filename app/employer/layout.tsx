import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { EmployerGuidanceShell } from "@/components/guidance/EmployerGuidanceShell";
import { getEffectiveSession } from "@/lib/auth/actingUser";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";
export const dynamic = "force-dynamic";

/**
 * Employer portal — employer role only (no employee or admin UI).
 */
export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const pathname = (await headers()).get("x-workvouch-pathname") ?? "";

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
    const rawRole = (profile as { role?: string | null } | null)?.role;
    const resolved = resolveUserRole({
      role: rawRole,
    });
    console.log("USER ROLE:", rawRole ?? resolved);

    if (resolved === "pending") {
      redirect("/choose-role");
    } else if (resolved === "super_admin" && !pathname.startsWith("/admin")) {
      redirect("/admin");
    } else if (resolved === "employee" && !pathname.startsWith("/dashboard")) {
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
