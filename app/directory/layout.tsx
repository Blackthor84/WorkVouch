import { NavbarServer } from "@/components/navbar-server";

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavbarServer />
      {children}
    </>
  );
}
