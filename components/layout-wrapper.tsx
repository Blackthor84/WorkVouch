"use client";

import Layout from "./Layout";
import { Providers } from "./providers";

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
    <Providers>
      <Layout>{children}</Layout>
    </Providers>
  );
}
