"use client";

export const dynamic = "force-dynamic";

import "./globals.css";
import Navbar from "@/components/navbar";
import { SupabaseProvider } from "@/components/SupabaseProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          <Navbar />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
