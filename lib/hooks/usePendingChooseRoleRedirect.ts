"use client";

import { useEffect } from "react";

/**
 * /choose-role routing is enforced only in proxy.ts (see getRoleAccessRedirect).
 * Client redirects here caused loops with edge resolution; keep this as a no-op.
 */
export function usePendingChooseRoleRedirect(
  _role: string | null | undefined,
  _loading: boolean
): void {
  useEffect(() => {
    // intentionally empty — proxy.ts handles pending → /choose-role
  }, []);
}
