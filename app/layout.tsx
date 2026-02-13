import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { Providers } from "@/components/providers";
import { PreviewProvider } from "@/lib/preview-context";
import SimulationBanner from "@/components/SimulationBanner";
import AuthSync from "./(auth)/AuthSync";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "WorkVouch - Trust-Based Professional Profiles",
  description:
    "Build your professional reputation through verified peer references. Trusted by security, law enforcement & professionals.",
  icons: {
    icon: "/icons/favicon-32.png",
    shortcut: "/icons/favicon-32.png",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  themeColor: "#2563EB",
  viewport: { width: "device-width", initialScale: 1, maximumScale: 5 },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "WorkVouch" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Development-only: log missing Stripe price IDs (no keys logged)
  if (process.env.NODE_ENV === "development" && process.env.STRIPE_SECRET_KEY) {
    try {
      const { logMissingStripePriceIds } = await import("@/lib/stripe/config");
      logMissingStripePriceIds();
    } catch (_) {
      // Ignore if stripe config fails
    }
  }

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-[#F8FAFC] flex flex-col min-h-screen antialiased transition-colors overflow-x-hidden">
        <AuthSync />
        <Providers>
          <PreviewProvider>
            <SimulationBanner />
            <LayoutWrapper user={null} roles={[]}>
              {children}
            </LayoutWrapper>
          </PreviewProvider>
        </Providers>
      </body>
    </html>
  );
}
