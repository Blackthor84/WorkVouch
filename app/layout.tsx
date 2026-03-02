"use client";

export const dynamic = "force-dynamic";

import "./globals.css";
import Navbar from "@/components/navbar";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import { LabBanner } from "@/components/lab/LabBanner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          <LabBanner />
          <Navbar />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
