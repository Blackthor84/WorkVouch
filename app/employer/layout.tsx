import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { EmployerGuidanceShell } from "@/components/guidance/EmployerGuidanceShell";

export const dynamic = "force-dynamic";

/**
 * Employer portal shell. Access control is enforced in proxy.ts only.
 */
export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-wv-bg text-wv-foreground">
      <EmployerGuidanceShell />
      <OnboardingProvider>{children}</OnboardingProvider>
    </div>
  );
}
