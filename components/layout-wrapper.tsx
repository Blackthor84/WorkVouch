"use client";

import Layout from "./Layout";

export function LayoutWrapper({
  children,
  user,
  roles,
}: {
  children: React.ReactNode;
  user: any;
  roles: string[];
}) {
  return <Layout>{children}</Layout>;
}
