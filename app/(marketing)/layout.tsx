import Footer from "@/components/Footer";
import MarketingClientLayout from "./MarketingClientLayout";

export const dynamic = "force-static";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketingClientLayout>
      {children}
      <Footer />
    </MarketingClientLayout>
  );
}
