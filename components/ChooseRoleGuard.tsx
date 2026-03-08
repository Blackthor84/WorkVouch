"use client";

import { usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";

/**
 * When user has no role set, redirect to /choose-role unless already there.
 */
export function ChooseRoleGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname?.startsWith("/choose-role")) {
      window.location.href = "/choose-role";
    }
  }, [pathname]);
  if (pathname?.startsWith("/choose-role")) {
    return <>{children}</>;
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0D1117]">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}
