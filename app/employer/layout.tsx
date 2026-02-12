import { NavbarServer } from "@/components/navbar-server";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarServer />
      <main className="flex-1 bg-background dark:bg-[#0D1117] min-h-screen">
        <OnboardingProvider>{children}</OnboardingProvider>
      </main>
    </>
  );
}
