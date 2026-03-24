"use client";

import { ReactNode } from "react";

/**
 * Routing to /choose-role for pending users is handled by proxy.ts and server layouts.
 * Client-side redirects here previously could race RSC/proxy and contribute to loops.
 *
 * If you add client navigation to /choose-role, use AuthContext/profile loading first:
 * - While role is unknown: return null or a small "Loading…" UI (do not redirect).
 * - Only when role === "pending" (or your resolved enum): router.push("/choose-role").
 */
export function ChooseRoleGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
