"use client";

export const dynamic = "force-dynamic";

import "./globals.css";
import Navbar from "@/components/navbar";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { LabBanner } from "@/components/lab/LabBanner";
import { CommandPaletteGlobal } from "@/components/command-palette/CommandPalette";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          <AuthProvider>
            <LabBanner />
            <Navbar />
            {children}
            <CommandPaletteGlobal />
          </AuthProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
