import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { getCurrentUser, getCurrentUserRoles } from "@/lib/auth";

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
  const user = await getCurrentUser();
  const roles = await getCurrentUserRoles();

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
