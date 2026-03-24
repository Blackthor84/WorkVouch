"use client";

import { useAuth } from "@/components/AuthContext";
import { hasEnterpriseAccess } from "@/lib/enterprise";
import EnterpriseLock from "./EnterpriseLock";
import { usePendingChooseRoleRedirect } from "@/lib/hooks/usePendingChooseRoleRedirect";

export function EnterpriseGate({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  usePendingChooseRoleRedirect(role, loading);

  if (loading || role === undefined) {
    return (
      <div className="min-h-[120px] flex items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (role === "pending") {
    return null;
  }

  if (role === "admin" || role === "superadmin") {
    return <>{children}</>;
  }

  if (hasEnterpriseAccess(role ?? "")) {
    return <>{children}</>;
  }

  return <EnterpriseLock feature="This area" />;
}
