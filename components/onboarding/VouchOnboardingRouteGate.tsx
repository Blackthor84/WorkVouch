"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const ALLOWED_PREFIXES = ["/onboarding"];

/**
 * Keeps employees inside the vouch onboarding flow until server marks loop complete.
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
    const ok = ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (!ok) {
      router.replace("/onboarding");
    }
  }, [needsOnboarding, pathname, router]);

  if (needsOnboarding && pathname && !ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 px-4 text-slate-500 text-sm">
        <p>Opening onboarding…</p>
      </div>
    );
  }

  return <>{children}</>;
}
