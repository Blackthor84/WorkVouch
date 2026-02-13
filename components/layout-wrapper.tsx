"use client";

import Layout from "./Layout";
import { Providers } from "./providers";
import { DemoModeActivator } from "./DemoModeActivator";
// import { RegisterSW } from "./pwa/RegisterSW";
export function LayoutWrapper({
  children,
  user,
  role,
}: {
  children: React.ReactNode;
  user: any;
  role?: string | null;
}) {
  return (
    <Providers>
      {/* PWA disabled until auth/static files stable */}
      {/* <RegisterSW /> */}
      <DemoModeActivator />
      <Layout>{children}</Layout>
    </Providers>
  );
}
