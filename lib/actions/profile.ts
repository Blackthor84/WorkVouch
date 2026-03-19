"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileUpdateInput = {
  full_name?: string;
  headline?: string;
  location?: string;
  bio?: string;
};

/**
 * Partial profile update. All fields optional; only provided fields are updated.
 * Uses upsert-friendly update (only set fields that are passed).
 * Location: only state is stored (no city per privacy rules).
 */
export async function updateProfile(input: ProfileUpdateInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const updates: Record<string, unknown> = {};

  if (input.full_name !== undefined) {
    const full_name = (input.full_name ?? "").trim();
    updates.full_name = full_name || null;
    const rawSlug = full_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    updates.public_slug = rawSlug || `user-${user.id.slice(0, 8)}`;
  }

  if (input.headline !== undefined) {
    updates.industry = (input.headline ?? "").trim() || null;
  }

  if (input.location !== undefined) {
    const loc = (input.location ?? "").trim();
    if (loc) {
      const parts = loc.split(",").map((p) => p.trim()).filter(Boolean);
      updates.state = parts.length >= 1 ? (parts[parts.length - 1] ?? null) : null;
    } else {
      updates.state = null;
    }
  }

  if (input.bio !== undefined) {
    updates.professional_summary = (input.bio ?? "").trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    revalidatePath("/profile");
    revalidatePath("/profile/edit");
    return {};
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return {};
}
