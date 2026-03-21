"use client";

import { useState } from "react";
import { WorkVouchSidebar } from "./WorkVouchSidebar";
import { WorkVouchNavbar } from "./WorkVouchNavbar";
import { UpgradeModal } from "./UpgradeModal";
import { ClaimCoworkerInviteBootstrap } from "@/components/invites/ClaimCoworkerInviteBootstrap";

export function WorkVouchLayoutClient({
  unreadNotificationCount,
  pendingReferenceRequestCount = 0,
  trustScore = 0,
  isPremium = false,
  userInitial,
  userEmail,
  profilePhotoUrl,
  children,
}: {
  unreadNotificationCount: number;
  pendingReferenceRequestCount?: number;
  trustScore?: number;
  isPremium?: boolean;
  userInitial: string;
  userEmail: string | null;
  profilePhotoUrl: string | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
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
  );
}
