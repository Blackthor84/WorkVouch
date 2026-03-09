"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProfileUpdateInput = {
  full_name: string;
  headline: string;
  location: string;
  bio: string;
};

/**
 * Update the current user's profile (full_name, industry/headline, city/state, professional_summary/bio).
 */
export async function updateProfile(input: ProfileUpdateInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const full_name = (input.full_name ?? "").trim();
  if (!full_name) return { error: "Full name is required" };
  const headline = (input.headline ?? "").trim() || null;
  const bio = (input.bio ?? "").trim() || null;

  // Generate public slug for /candidate/[slug] (e.g. "Jane Doe" -> "jane-doe")
  const rawSlug = full_name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const public_slug = rawSlug || `user-${user.id.slice(0, 8)}`;

  // Parse location into city, state (e.g. "Manchester, NH" -> city: Manchester, state: NH)
  let city: string | null = null;
  let state: string | null = null;
  const loc = (input.location ?? "").trim();
  if (loc) {
    const parts = loc.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      city = parts[0] ?? null;
      state = parts.slice(1).join(", ") ?? null;
    } else {
      city = parts[0] ?? null;
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      industry: headline,
      city,
      state,
      professional_summary: bio,
      public_slug,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/profile/edit");
  return {};
}
