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
          <NavbarServer />
          {children}
        </Providers>
      </body>
    </html>
  );
}
