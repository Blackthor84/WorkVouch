import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

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
