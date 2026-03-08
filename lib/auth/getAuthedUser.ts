/**
 * Single source of truth for authenticated user in API routes.
 * Uses the same auth source as admin APIs: Supabase server client + auth.getUser().
 * Role from app_metadata.role (user | admin | superadmin). Never reads cookies/headers directly.
 */

import { getUser } from "@/lib/auth/getUser";
import { getRoleFromUser, type UserLike } from "@/lib/auth/admin-role-guards";

export type AuthedUser = {
  user: { id: string; email: string };
  role: "user" | "admin" | "superadmin";
};

export async function getAuthedUser(): Promise<AuthedUser | null> {
  try {
    const user = await getUser();
    if (!user) return null;

    if (!user?.id || !user?.email) {
      return null;
    }

    const userLike: UserLike = {
      id: user.id,
      email: user.email,
      app_metadata: (user as { app_metadata?: { role?: string } }).app_metadata,
    };

    const role = getRoleFromUser(userLike);

    return {
      user: { id: user.id, email: user.email },
      role,
    };
  } catch {
    return null;
  }
}
