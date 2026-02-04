import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { NavbarServer } from "@/components/navbar-server";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    console.log("REDIRECT TRIGGERED IN: app/employer/layout.tsx");
    redirect("/login");
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
