"use client";

import { ReactNode } from "react";

/**
 * Routing to /choose-role for pending users is handled by proxy.ts and server layouts.
 * Client-side redirects here previously could race RSC/proxy and contribute to loops.
 */
export function ChooseRoleGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
