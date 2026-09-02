/**
 * Ensures a legacy production `public.users` row exists for the auth/profile UUID.
 * Required because `public.invites.sender_id` FK targets `public.users.id`, while the
 * app identity model uses `auth.users.id` = `profiles.id` with no automatic users sync.
 */

import { admin } from "@/lib/supabase-admin";
import type { PostgrestErrorLike } from "@/lib/supabase/postgrestErrors";

type ProfileRow = {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
};

export type EnsureLegacyUsersRowResult = {
  userId: string;
  error: PostgrestErrorLike;
};

/**
 * Idempotent: upserts `public.users` with `onConflict: id` + `ignoreDuplicates`.
 * Returns the canonical sender id (= authUserId).
 */
export async function ensureLegacyUsersRowForAuthUser(
  authUserId: string,
  options?: { email?: string | null }
): Promise<EnsureLegacyUsersRowResult> {
  const adminAny = admin as {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: unknown; error: PostgrestErrorLike }> };
      };
      upsert: (
        row: Record<string, string>,
        opts: { onConflict: string; ignoreDuplicates: boolean }
      ) => Promise<{ error: PostgrestErrorLike }>;
    };
  };

  const { data: profileData, error: profileError } = await adminAny
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", authUserId)
    .maybeSingle();

  if (profileError) {
    return { userId: authUserId, error: profileError };
  }

  const profile = profileData as ProfileRow | null;

  const email =
    (profile?.email && String(profile.email).trim()) ||
    (options?.email && String(options.email).trim()) ||
    `${authUserId}@placeholder.local`;

  const fullName =
    (profile?.full_name && String(profile.full_name).trim()) ||
    email.split("@")[0]?.trim() ||
    "User";

  const row: Record<string, string> = {
    id: authUserId,
    email,
    name: fullName,
    full_name: fullName,
  };

  const role = profile?.role != null ? String(profile.role).trim() : "";
  if (role) {
    row.role = role;
  }

  const { error: upsertError } = await adminAny.from("users").upsert(row, {
    onConflict: "id",
    ignoreDuplicates: true,
  });

  if (upsertError) {
    return { userId: authUserId, error: upsertError };
  }

  return { userId: authUserId, error: null };
}
