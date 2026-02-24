"use client";

import dynamic from "next/dynamic";
import type { NavbarClientProps } from "./navbar-client";

const NavbarClient = dynamic(
  () => import("./navbar-client").then((mod) => ({ default: mod.NavbarClient })),
  { ssr: false }
);

export function NavbarClientDynamic(props: NavbarClientProps) {
  return <NavbarClient {...props} />;
}
