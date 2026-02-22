import { headers } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/admin";

const HEADER_IMPERSONATED = "x-impersonated-user-id";

export type CurrentUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  isImpersonated: boolean;
};

/**
 * Server-side: resolve current user. When impersonating, returns the impersonated user (from middleware header).
 * Otherwise returns null; callers should use getAuthedUser() or session for normal auth.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const h = await headers();
  const impersonatedUserId = h.get(HEADER_IMPERSONATED)?.trim();

  if (impersonatedUserId) {
    const supabase = getSupabaseServer();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, user_id, email, full_name, role")
      .or(`id.eq.${impersonatedUserId},user_id.eq.${impersonatedUserId}`)
      .maybeSingle();

    if (profile && typeof profile === "object" && "id" in profile) {
      const row = profile as { id: string; user_id?: string | null; email?: string | null; full_name?: string | null; role?: string | null };
      return {
        id: row.user_id ?? row.id,
        email: row.email ?? null,
        full_name: row.full_name ?? null,
        role: row.role ?? null,
        isImpersonated: true,
      };
    }
    return {
      id: impersonatedUserId,
      email: null,
      full_name: null,
      role: null,
      isImpersonated: true,
    };
  }

  return null;
}
