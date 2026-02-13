import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createServerSupabase } from "@/lib/supabase/server";

export type RequireUserResult = {
  supabase: Awaited<ReturnType<typeof createServerSupabase>>;
  user: { id: string; email?: string | null };
};

/**
 * Centralized auth: ensure user is logged in (NextAuth session).
 * Returns { supabase, user }. Use for protected server pages.
 * Proxy protects routes; this enforces login and provides a single supabase instance.
 */
export async function requireUser(): Promise<RequireUserResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?reason=session_expired");
  }

  const supabase = await createServerSupabase();
  return {
    supabase,
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
    },
  };
}
