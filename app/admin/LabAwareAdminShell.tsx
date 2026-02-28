"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

const LAB_PATH = "/admin/playground";

function isLabRoute(pathname: string): boolean {
  return pathname === LAB_PATH || pathname.startsWith(LAB_PATH + "/");
}

type Props = {
  sidebarProps: React.ComponentProps<typeof AdminSidebar>;
  containerClassName: string;
  children: React.ReactNode;
};

/**
 * When on the Lab route (/admin/playground), hide the global admin sidebar so the Lab
 * is self-contained with its own dashboard. Other admin routes show the normal sidebar.
 */
export function LabAwareAdminShell({ sidebarProps, containerClassName, children }: Props) {
  const pathname = usePathname();
  const inLab = isLabRoute(pathname ?? "");

  return (
    <div className={containerClassName}>
      {!inLab && <AdminSidebar {...sidebarProps} />}
      <main className="flex-1 min-h-screen overflow-auto text-[#0F172A]">
        {children}
      </main>
    </div>
  );
}
