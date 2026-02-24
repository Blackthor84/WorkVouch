import "./globals.css";
import { Providers } from "@/components/providers";
import { LayoutWrapper } from "@/components/layout-wrapper";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] min-h-screen antialiased">
        <Providers>
          <LayoutWrapper user={null} role={null}>
            <div className="max-w-7xl mx-auto px-4">
              {children}
            </div>
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
