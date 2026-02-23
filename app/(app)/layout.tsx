import { NavbarServer } from "@/components/navbar-server";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import AuthProvider from "@/components/AuthProvider";
import { ImpersonationProvider } from "@/components/impersonation/ImpersonationContext";

export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ImpersonationProvider>
        <ImpersonationBanner />
        <NavbarServer />
      <main className="flex-1 bg-[#F8FAFC] min-h-screen overflow-x-hidden pb-20 md:pb-0">
        <OnboardingProvider>{children}</OnboardingProvider>
      </main>
      <MobileBottomNav />
      </ImpersonationProvider>
    </AuthProvider>
  );
}
