import { admin } from "@/lib/supabase-admin";

type UserLike = {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string; name?: string } | null;
};

/**
 * Ensures a `profiles` row exists for the auth user via upsert with ON CONFLICT DO NOTHING
 * (does not overwrite an existing row). Uses admin to bypass RLS.
 */
export async function ensureProfileRowForUser(user: UserLike): Promise<void> {
  const adminAny = admin as any;
  const meta = user.user_metadata;
  const fromMeta =
    (meta?.full_name && String(meta.full_name).trim()) ||
    (meta?.name && String(meta.name).trim()) ||
    "";
  const fromEmail = user.email?.split("@")[0]?.trim() || "";
  const full_name = fromMeta || fromEmail || "User";
  const email = (user.email ?? "").trim() || `${user.id}@placeholder.local`;

  const { error } = await adminAny.from("profiles").upsert(
    {
      id: user.id,
      email,
      full_name,
      visibility: "private",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (error) {
    console.warn("[ensureProfileRowForUser] upsert:", error.message);
  }
}
