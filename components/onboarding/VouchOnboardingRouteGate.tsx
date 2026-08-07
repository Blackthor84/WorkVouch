"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const ALLOWED_PATHS = ["/onboarding"];

/**
 * Keeps employees inside the canonical onboarding wizard until the vouch loop is complete.
 */
export function VouchOnboardingRouteGate({
  needsOnboarding,
  children,
}: {
  needsOnboarding: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!needsOnboarding) return;
    if (!pathname) return;
    const ok = ALLOWED_PATHS.includes(pathname);
    if (!ok) {
      router.replace("/onboarding");
    }
  }, [needsOnboarding, pathname, router]);

  if (needsOnboarding && pathname && !ALLOWED_PATHS.includes(pathname)) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 px-4 text-slate-500 text-sm">
        <p>Opening onboarding…</p>
      </div>
    );
  }

  return <>{children}</>;
}
