"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * When profile role is known (not loading) and exactly "pending", navigate to choose-role.
 * Does nothing while role is undefined (still loading) or null — avoids redirect loops.
 */
export function usePendingChooseRoleRedirect(
  role: string | null | undefined,
  loading: boolean
): void {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || role === undefined) return;
    if (role !== "pending") return;
    if (!pathname || pathname.startsWith("/choose-role")) return;
    router.replace("/choose-role");
  }, [loading, role, pathname, router]);
}
