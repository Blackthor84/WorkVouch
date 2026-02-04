import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getCurrentUserProfile, getCurrentUserRoles } from "@/lib/auth";
import { NavbarClient } from "./navbar-client";

export async function NavbarServer() {
  const session = await getServerSession(authOptions);
  const profile = session?.user ? await getCurrentUserProfile() : null;
  const roles = session?.user ? await getCurrentUserRoles() : [];
  const role = profile?.role ?? roles[0] ?? (session?.user as { role?: string })?.role ?? null;
  return (
    <NavbarClient
      user={session?.user ?? undefined}
      roles={roles.length > 0 ? roles : (session?.user as { roles?: string[] })?.roles ?? undefined}
      role={role ?? undefined}
    />
  );
}
