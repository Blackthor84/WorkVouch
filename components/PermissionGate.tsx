"use client";

import { hasPermission, type Role } from "@/lib/auth/roles";
import { useAuth } from "@/components/AuthContext";

type Props = {
  perm: string;
  children: React.ReactNode;
};

export function PermissionGate({ perm, children }: Props) {
  const { role } = useAuth();
  if (!role) return null;
  if (role === "admin" || role === "superadmin") return <>{children}</>;
  if (!hasPermission(role as Role, perm)) return null;
  return <>{children}</>;
}
