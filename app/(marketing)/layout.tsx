import dynamicImport from "next/dynamic";
import Footer from "@/components/Footer";

export const dynamic = "force-static";

const Navbar = dynamicImport(
  () => import("@/components/navbar"),
  { ssr: false }
);

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
