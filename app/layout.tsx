import "./globals.css";
import { Providers } from "@/components/providers";
import { PreviewProvider } from "@/lib/preview-context";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <PreviewProvider>
            {children}
          </PreviewProvider>
        </Providers>
      </body>
    </html>
  );
}
