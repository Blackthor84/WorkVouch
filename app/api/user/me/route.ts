import { headers, cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

const IMPERSONATION_COOKIE = "impersonation_session";

/** Resolve impersonated user id from header (middleware) or from cookie. */
async function getImpersonatedUserId(): Promise<string | null> {
  const h = await headers();
  const fromHeader = h.get("x-impersonated-user-id")?.trim();
  if (fromHeader) return fromHeader;

  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value?.trim();
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as { impersonatedUserId?: string };
    if (session.impersonatedUserId) return session.impersonatedUserId.trim();
  } catch {
    // plain userId string (e.g. from impersonate route)
  }
  return raw;
}

/**
 * GET /api/user/me — effective user. When impersonation_session cookie is present, returns the
 * impersonated user without requiring normal auth. Otherwise returns the authenticated user.
 */
export async function GET() {
  const impersonatedUserId = await getImpersonatedUserId();
  const supabase = await supabaseServer();

  let userId: string | null = impersonatedUserId;
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("user_id, id, email, full_name, role, onboarding_completed")
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (error || !profile) {
    return new Response("Unauthorized", { status: 401 });
  }

  const row = profile as {
    user_id?: string;
    id?: string;
    email: string | null;
    full_name: string;
    role: string | null;
    onboarding_completed?: boolean;
  };
  const id = row.user_id ?? row.id ?? userId;
  return Response.json({
    id,
    email: row.email ?? undefined,
    full_name: row.full_name,
    role: row.role ?? "user",
    onboarding_complete: Boolean(row.onboarding_completed),
  });
}
