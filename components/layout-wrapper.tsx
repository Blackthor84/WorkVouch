"use client";

import { Suspense } from "react";
import Layout from "./Layout";
import { Providers } from "./providers";
import { DemoModeActivatorWithParams } from "./DemoModeActivator";
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
      <Suspense fallback={null}>
        <DemoModeActivatorWithParams />
      </Suspense>
      <Layout>{children}</Layout>
    </Providers>
  );
}
