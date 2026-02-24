import dynamic from "next/dynamic";
import Footer from "@/components/Footer";

const Navbar = dynamic(() => import("@/components/navbar"), { ssr: false });

export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background dark:bg-[#0D1117] min-h-screen overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </>
  );
}
