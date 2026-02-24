"use client";

import Layout from "./Layout";
import { Providers } from "./providers";
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
      <Layout>{children}</Layout>
    </Providers>
  );
}
