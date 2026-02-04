import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { NavbarServer } from "@/components/navbar-server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const roles = session.user.roles || [];
  const isAdmin =
    roles.includes("admin") || roles.includes("superadmin");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <>
      <NavbarServer />
      <main className="flex-1 bg-background dark:bg-[#0D1117] min-h-screen">
        {children}
      </main>
    </>
  );
}
