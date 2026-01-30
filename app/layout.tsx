import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { PreviewProvider } from "@/lib/preview-context";
import SimulationBanner from "@/components/SimulationBanner";

export const metadata: Metadata = {
  title: "WorkVouch - Trust-Based Professional Profiles",
  description:
    "Build your professional reputation through verified peer references. Trusted by security, law enforcement & professionals.",
  icons: {
    icon: "/images/workvouch-logo.png.png",
    apple: "/images/workvouch-logo.png.png",
  },
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
      <body className="bg-background dark:bg-[#0D1117] flex flex-col min-h-screen antialiased transition-colors">
        <PreviewProvider>
          <SimulationBanner />
          <LayoutWrapper user={null} roles={[]}>
            {children}
          </LayoutWrapper>
        </PreviewProvider>
      </body>
    </html>
  );
}
