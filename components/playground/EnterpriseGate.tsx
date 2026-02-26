"use client";

import { useAuth } from "@/components/AuthContext";
import { hasEnterpriseAccess } from "@/lib/enterprise";
import EnterpriseLock from "./EnterpriseLock";

export function EnterpriseGate({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();

  // ADMINS SEE EVERYTHING
  if (role === "admin" || role === "superadmin") {
    return <>{children}</>;
  }

  // Enterprise customers see content
  if (hasEnterpriseAccess(role ?? "")) {
    return <>{children}</>;
  }

  // Non-admins without enterprise see upsell
  return <EnterpriseLock feature="This area" />;
}
