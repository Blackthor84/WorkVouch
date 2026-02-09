import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("REDIRECT TRIGGERED IN: app/employer/layout.tsx");
      redirect("/login");
    }
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
