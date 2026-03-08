import { getUser } from "@/lib/auth/getUser";

export async function getServerSession() {
  const user = await getUser();
  return user ? { user } : null;
}
