import Footer from "@/components/Footer";
import PublicClientLayout from "./PublicClientLayout";

export const dynamic = "force-static";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicClientLayout>
      {children}
      <Footer />
    </PublicClientLayout>
  );
}
