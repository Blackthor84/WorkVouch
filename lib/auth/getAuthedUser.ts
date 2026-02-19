/**
 * Single source of truth for authenticated user in API routes.
 * Uses the same auth source as admin APIs: Supabase server client + auth.getUser().
 * Role from app_metadata.role (user | admin | superadmin). Never reads cookies/headers directly.
 */

import { supabaseServer } from "@/lib/supabase/server";
import { getRoleFromSession, type SessionLike } from "@/lib/auth/admin-role-guards";

export type AuthedUser = {
  user: { id: string; email: string };
  role: "user" | "admin" | "superadmin";
};

export async function getAuthedUser(): Promise<AuthedUser | null> {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return null;
    }

    const session: SessionLike = {
      user: {
        id: user.id,
        email: user.email,
        app_metadata: (user as { app_metadata?: { role?: string } }).app_metadata,
      },
    };

    const role = getRoleFromSession(session);

    return {
      user: { id: user.id, email: user.email },
      role,
    };
  } catch {
    return null;
  }
}
