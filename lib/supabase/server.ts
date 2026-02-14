import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { jwtVerify } from "jose";

const IMPERSONATION_COOKIE = "workvouch_impersonation";

export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set(name, value, options ?? {});
        },
        remove(name, options) {
          cookieStore.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );
}

/** Use in protected API routes when session is missing. */
export function upgradeRequired401() {
  return NextResponse.json({ error: "🚨 Upgrade Required" }, { status: 401 });
}

/** @deprecated Use supabaseServer */
export const createSupabaseServerClient = supabaseServer;

/** @deprecated Use supabaseServer */
export const createServerSupabase = supabaseServer;

/** @deprecated Use supabaseServer */
export const getSupabaseServer = supabaseServer;

/** Get current Supabase session (use instead of NextAuth getServerSession). Respects impersonation cookie. */
export async function getSupabaseSession() {
  const supabase = await supabaseServer();
  const cookieStore = await cookies();
  const impersonationToken = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (impersonationToken) {
    try {
      const secret = new TextEncoder().encode(
        process.env.NEXTAUTH_SECRET || process.env.IMPERSONATION_JWT_SECRET || "impersonation-secret"
      );
      const { payload } = await jwtVerify(impersonationToken, secret);
      const impersonatedUserId = payload.impersonated_user_id as string | undefined;
      if (impersonatedUserId) {
        const { getSupabaseServer } = await import("@/lib/supabase/admin");
        const admin = getSupabaseServer();
        const { data: profile } = await (admin as any)
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", impersonatedUserId)
          .single();
        const { data: rolesData } = await (admin as any)
          .from("user_roles")
          .select("role")
          .eq("user_id", impersonatedUserId);
        const roleList: string[] = (rolesData ?? []).map((r: { role: string }) => r.role);
        const user = profile
          ? {
              id: profile.id,
              email: profile.email ?? undefined,
              user_metadata: { full_name: profile.full_name },
              role: roleList[0] ?? undefined,
            }
          : null;
        if (user) {
          const sessionLike = {
            user: { ...user, id: profile!.id },
            impersonating: true as const,
          };
          return { session: sessionLike as any, user };
        }
      }
    } catch {
      // Invalid or expired; fall through to real session
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, session: user ? { user } : null };
}
