"use client";

import { usePathname } from "next/navigation";
import { HomepageNavbar } from "@/components/homepage-navbar";
import { NavbarClient } from "@/components/navbar-client";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth";

export async function NavbarConditional() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  if (isHomepage) {
    return <HomepageNavbar />;
  }

  const user = await getCurrentUser();
  const profile = await getCurrentUserProfile();

  return null;
}
