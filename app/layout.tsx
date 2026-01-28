import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { getCurrentUser, getCurrentUserRoles } from "@/lib/auth";

export const metadata: Metadata = {
  title: "WorkVouch - Trust-Based Professional Profiles",
  description:
    "Build your professional reputation through verified peer references. Trusted by security, law enforcement & professionals.",
  icons: {
    icon: "/workvouch-logo.png",
    apple: "/workvouch-logo.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const roles = await getCurrentUserRoles();

  // Environment variable debug logging (server-side only)
  if (process.env.NODE_ENV === "development") {
    console.log("=== WorkVouch Environment Variables Debug ===");
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "❌ MISSING");
    console.log("STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✅ SET" : "❌ MISSING");
    console.log("STRIPE_PRICE_STARTER:", process.env.STRIPE_PRICE_STARTER || "❌ MISSING");
    console.log("STRIPE_PRICE_TEAM:", process.env.STRIPE_PRICE_TEAM || "❌ MISSING");
    console.log("STRIPE_PRICE_PRO:", process.env.STRIPE_PRICE_PRO || "❌ MISSING");
    console.log("STRIPE_PRICE_SECURITY:", process.env.STRIPE_PRICE_SECURITY || "❌ MISSING");
    console.log("STRIPE_PRICE_ONE_TIME:", process.env.STRIPE_PRICE_ONE_TIME || "❌ MISSING");
    console.log("=============================================");
  }

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className="bg-background dark:bg-[#0D1117] flex flex-col min-h-screen antialiased transition-colors">
        <LayoutWrapper user={user} roles={roles}>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
