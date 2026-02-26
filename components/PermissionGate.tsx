"use client";

import { hasPermission } from "@/lib/auth/roles";
import { useAuth } from "@/components/AuthContext";

type Props = {
  perm: string;
  children: React.ReactNode;
};

export function PermissionGate({ perm, children }: Props) {
  const { role } = useAuth();
  if (!role || !hasPermission(role, perm)) return null;
  return <>{children}</>;
}
