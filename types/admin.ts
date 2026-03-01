import type { ReactNode } from "react";
import type { AdminSidebarProps } from "@/components/admin/AdminSidebar";

export type LabAwareAdminShellConfig = {
  containerClassName?: string;
  sidebarProps: AdminSidebarProps;
};

export type LabAwareAdminShellProps = LabAwareAdminShellConfig & {
  children: ReactNode;
};
