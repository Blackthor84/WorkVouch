import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
import { NavbarServer } from "@/components/navbar-server";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { getAppModeFromHeaders } from "@/lib/app-mode";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const isSandbox = getAppModeFromHeaders(headersList) === "sandbox";

  if (!isSandbox) {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
  }

  return (
    <>
      <NavbarServer />
      <main className="flex-1 bg-background dark:bg-[#0D1117] min-h-screen">
        <OnboardingProvider>{children}</OnboardingProvider>
      </main>
    </>
  );
}
