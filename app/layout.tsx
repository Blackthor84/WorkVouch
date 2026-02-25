export const dynamic = "force-dynamic";

import "./globals.css";
import { NavbarServer } from "@/components/navbar-server";
import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div style={{ background: "red", color: "white" }}>
            ROOT LAYOUT LOADED
          </div>
          <NavbarServer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
