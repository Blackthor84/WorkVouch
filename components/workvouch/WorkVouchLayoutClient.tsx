"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { WorkVouchSidebar } from "./WorkVouchSidebar";
import { WorkVouchNavbar } from "./WorkVouchNavbar";
import { UpgradeModal } from "./UpgradeModal";
import { ClaimCoworkerInviteBootstrap } from "@/components/invites/ClaimCoworkerInviteBootstrap";
import { VouchOnboardingRouteGate } from "@/components/onboarding/VouchOnboardingRouteGate";

export function WorkVouchLayoutClient({
  unreadNotificationCount,
  pendingReferenceRequestCount = 0,
  trustScore = 0,
  isPremium = false,
  userInitial,
  userEmail,
  profilePhotoUrl,
  needsVouchOnboarding = false,
  children,
}: {
  unreadNotificationCount: number;
  pendingReferenceRequestCount?: number;
  trustScore?: number;
  isPremium?: boolean;
  userInitial: string;
  userEmail: string | null;
  profilePhotoUrl: string | null;
  /** When true, employee must stay in /onboarding until the vouch loop is marked complete. */
  needsVouchOnboarding?: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const onboardingMinimal =
    needsVouchOnboarding && (pathname === "/onboarding" || pathname?.startsWith("/onboarding/"));

  if (onboardingMinimal) {
    return (
      <VouchOnboardingRouteGate needsOnboarding={needsVouchOnboarding}>
        <div className="min-h-screen bg-wv-bg">
          <ClaimCoworkerInviteBootstrap />
          {children}
        </div>
        <UpgradeModal />
      </VouchOnboardingRouteGate>
    );
  }

  return (
    <VouchOnboardingRouteGate needsOnboarding={needsVouchOnboarding}>
    <div className="relative flex min-h-screen bg-wv-bg">
      {/* Ambient lighting */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/8 blur-[100px]" />
        <div className="absolute bottom-0 left-64 h-[300px] w-[300px] rounded-full bg-violet-600/6 blur-[80px]" />
      </div>
      <WorkVouchSidebar
        pendingReferenceRequestCount={pendingReferenceRequestCount}
        trustScore={trustScore}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="relative z-10 flex flex-1 flex-col min-w-0">
        <WorkVouchNavbar
          unreadNotificationCount={unreadNotificationCount}
          trustScore={trustScore}
          userInitial={userInitial}
          userEmail={userEmail}
          profilePhotoUrl={profilePhotoUrl}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto min-h-0">
          <ClaimCoworkerInviteBootstrap />
          {children}
        </main>
      </div>
      <UpgradeModal />
    </div>
    </VouchOnboardingRouteGate>
  );
}
