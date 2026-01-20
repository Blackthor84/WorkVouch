import { getCurrentUser, getCurrentUserRoles } from "@/lib/auth"
import { NavbarClient } from "./navbar-client"

export async function NavbarServer() {
  const user = await getCurrentUser()
  const roles = await getCurrentUserRoles()

  return <NavbarClient user={user} roles={roles} />
}
