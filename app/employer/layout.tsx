import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { EmployerGuidanceShell } from "@/components/guidance/EmployerGuidanceShell";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex-1 bg-background dark:bg-[#0D1117] min-h-screen relative">
      <EmployerGuidanceShell />
      <OnboardingProvider>{children}</OnboardingProvider>
    </main>
  );
}
