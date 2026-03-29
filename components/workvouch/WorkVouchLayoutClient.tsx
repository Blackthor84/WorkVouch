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
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
          <ClaimCoworkerInviteBootstrap />
          {children}
        </div>
        <UpgradeModal />
      </VouchOnboardingRouteGate>
    );
  }

  return (
    <VouchOnboardingRouteGate needsOnboarding={needsVouchOnboarding}>
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <WorkVouchSidebar
        pendingReferenceRequestCount={pendingReferenceRequestCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0">
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
