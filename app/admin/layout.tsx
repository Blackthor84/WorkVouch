import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { NavbarServer } from "@/components/navbar-server";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";

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

  const profile = await getCurrentUserProfile();
  const roles = await getCurrentUserRoles();
  const role = profile?.role ?? roles[0] ?? null;
  if (!isAdmin(role) && !roles.some((r) => isAdmin(r))) {
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
