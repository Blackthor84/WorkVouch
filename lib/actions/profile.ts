"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileUpdateInput = {
  full_name?: string;
  headline?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
};

/**
 * Partial profile update. All fields optional.
 * Only updates fields that are present in input; does NOT overwrite others with null.
 * Accepts empty string or null for any field.
 */
export async function updateProfile(input: ProfileUpdateInput): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const updates: Record<string, unknown> = {};

    if (input.full_name !== undefined) {
      const v = (input.full_name ?? "").trim();
      updates.full_name = v || null;
      const rawSlug = v
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      updates.public_slug = rawSlug || `user-${user.id.slice(0, 8)}`;
    }
    if (input.headline !== undefined) {
      updates.headline = (input.headline ?? "").trim() || null;
    }
    if (input.location !== undefined) {
      const loc = (input.location ?? "").trim();
      updates.state = loc ? loc.split(",").map((p) => p.trim()).filter(Boolean).pop() ?? null : null;
    }
    if (input.bio !== undefined) {
      updates.professional_summary = (input.bio ?? "").trim() || null;
    }
    if (input.avatar_url !== undefined) {
      updates.profile_photo_url = (input.avatar_url ?? "").trim() || null;
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
  } catch (e) {
    console.warn("Profile update error:", e);
    return { error: (e instanceof Error ? e.message : "Update failed") };
  }
}
