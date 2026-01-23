import Navbar from "./navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen">{children}</main>
    </>
  );
}
