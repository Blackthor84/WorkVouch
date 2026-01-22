"use client";

import { usePathname } from "next/navigation";
import { HomepageNavbar } from "@/components/homepage-navbar";
import { HomepageFooter } from "@/components/homepage-footer";
import { NavbarClient } from "@/components/navbar-client";

export function LayoutWrapper({
  children,
  user,
  roles,
}: {
  children: React.ReactNode;
  user: any;
  roles: string[];
}) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  return (
    <div className="flex flex-col min-h-screen justify-between">
      <header className="mb-8">
        {isHomepage ? (
          <HomepageNavbar />
        ) : (
          <NavbarClient user={user} roles={roles} />
        )}
      </header>
      <main className="flex-1 flex flex-col justify-center space-y-8">{children}</main>
      <footer className="mt-8">{isHomepage ? <HomepageFooter /> : null}</footer>
    </div>
  );
}
