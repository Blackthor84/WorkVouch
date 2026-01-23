"use client";

import Navbar from "@/components/simple-navbar";

export function LayoutWrapper({
  children,
  user,
  roles,
}: {
  children: React.ReactNode;
  user: any;
  roles: string[];
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar /> {/* single navbar for all pages */}
      <main>{children}</main>
    </div>
  );
}
