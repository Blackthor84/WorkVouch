"use client";

import { useState } from "react";
import { PeerCVSidebar } from "./PeerCVSidebar";
import { PeerCVNavbar } from "./PeerCVNavbar";

export function PeerCVLayoutClient({
  unreadNotificationCount,
  userInitial,
  profilePhotoUrl,
  children,
}: {
  unreadNotificationCount: number;
  userInitial: string;
  profilePhotoUrl: string | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PeerCVSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <PeerCVNavbar
          unreadNotificationCount={unreadNotificationCount}
          userInitial={userInitial}
          profilePhotoUrl={profilePhotoUrl}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
