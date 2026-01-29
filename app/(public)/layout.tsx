import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background dark:bg-[#0D1117] min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
