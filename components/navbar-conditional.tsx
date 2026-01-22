"use client";

import { usePathname } from "next/navigation";
import { HomepageNavbar } from "@/components/homepage-navbar";
import { NavbarClient } from "@/components/navbar-client";
import { getCurrentUser, getCurrentUserRoles } from "@/lib/auth";

export async function NavbarConditional() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  if (isHomepage) {
    return <HomepageNavbar />;
  }

  // For non-homepage, we need to get user data
  // Since this is client-side, we'll need to fetch it
  const user = await getCurrentUser();
  const roles = await getCurrentUserRoles();

  return <NavbarClient user={user} roles={roles} />;
}
