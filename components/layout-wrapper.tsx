"use client";

import Layout from "./Layout";

export function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
