"use client";

import { useAuth } from "@/components/AuthContext";
import { hasEnterpriseAccess } from "@/lib/enterprise";
import EnterpriseLock from "./EnterpriseLock";

export function EnterpriseGate({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[120px] flex items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

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
