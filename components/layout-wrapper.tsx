"use client";

import Layout from "./Layout";
import { Providers } from "./providers";
import { DemoModeActivator } from "./DemoModeActivator";
// import { RegisterSW } from "./pwa/RegisterSW";
import { PWAInstallPrompt } from "./pwa/PWAInstallPrompt";

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
      {/* PWA disabled until auth/static files stable */}
      {/* <RegisterSW /> */}
      <PWAInstallPrompt />
      <DemoModeActivator />
      <Layout>{children}</Layout>
    </Providers>
  );
}
