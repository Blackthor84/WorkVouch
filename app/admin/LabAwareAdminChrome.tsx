"use client";

import { usePathname } from "next/navigation";
import { AdminGlobalBar } from "@/components/admin/AdminGlobalBar";
import type { AdminSidebarProps } from "@/components/admin/AdminSidebar";
import { LabAwareAdminShell } from "./LabAwareAdminShell";
import type { ReactNode } from "react";

const LAB_PATH = "/admin/playground";

function isLabRoute(pathname: string): boolean {
  return pathname === LAB_PATH || pathname.startsWith(LAB_PATH + "/");
}

type AdminGlobalBarProps = {
  env: "PRODUCTION" | "SANDBOX";
  role: string;
  email: string;
  isSandbox: boolean;
  overrideActive?: boolean;
  overrideExpiresAt?: string | null;
  isFounder?: boolean;
};

type LabAwareAdminShellProps = {
  containerClassName: string;
  sidebarProps: AdminSidebarProps;
  children: ReactNode;
};

/**
 * When on the Trust Lab route, completely remove the global admin bar and navigation.
 * Lab Mode has its own dedicated dashboard with no external navigation.
 */
export function LabAwareAdminChrome({
  barProps,
  shellProps,
  children,
}: {
  barProps: AdminGlobalBarProps;
  shellProps: LabAwareAdminShellProps;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const inLab = isLabRoute(pathname ?? "");

  if (inLab) {
    return (
      <LabAwareAdminShell
        containerClassName={shellProps.containerClassName}
        sidebarProps={shellProps.sidebarProps}
      >
        {children}
      </LabAwareAdminShell>
    );
  }

  return (
    <>
      <AdminGlobalBar
        env={barProps.env}
        role={barProps.role as "ADMIN" | "SUPERADMIN"}
        email={barProps.email}
        isSandbox={barProps.isSandbox}
        overrideActive={barProps.overrideActive}
        overrideExpiresAt={barProps.overrideExpiresAt}
        isFounder={barProps.isFounder}
      />
      <LabAwareAdminShell
        containerClassName={shellProps.containerClassName}
        sidebarProps={shellProps.sidebarProps}
      >
        {children}
      </LabAwareAdminShell>
    </>
  );
}
