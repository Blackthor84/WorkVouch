"use client";

import { hasPermission, type Role } from "@/lib/auth/roles";
import { useAuth } from "@/components/AuthContext";
import { usePendingChooseRoleRedirect } from "@/lib/hooks/usePendingChooseRoleRedirect";

type Props = {
  perm: string;
  children: React.ReactNode;
};

export function PermissionGate({ perm, children }: Props) {
  const { role, loading } = useAuth();
  usePendingChooseRoleRedirect(role, loading);

  if (loading || role === undefined) return null;
  if (role === "pending") return null;
  if (role === null) return null;
  if (role === "admin" || role === "superadmin") return <>{children}</>;
  if (!hasPermission(role as Role, perm)) return null;
  return <>{children}</>;
}
