"use client";

import Layout from "./Layout";
import { Providers } from "./providers";
import { DemoModeActivator } from "./DemoModeActivator";

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
      <DemoModeActivator />
      <Layout>{children}</Layout>
    </Providers>
  );
}
