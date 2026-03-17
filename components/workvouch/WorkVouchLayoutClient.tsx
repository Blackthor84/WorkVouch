"use client";

import { useState } from "react";
import { WorkVouchSidebar } from "./WorkVouchSidebar";
import { WorkVouchNavbar } from "./WorkVouchNavbar";

export function WorkVouchLayoutClient({
  unreadNotificationCount,
  userInitial,
  userEmail,
  profilePhotoUrl,
  children,
}: {
  unreadNotificationCount: number;
  userInitial: string;
  userEmail: string | null;
  profilePhotoUrl: string | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <WorkVouchSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <WorkVouchNavbar
          unreadNotificationCount={unreadNotificationCount}
          userInitial={userInitial}
          userEmail={userEmail}
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
