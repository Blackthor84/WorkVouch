import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveSession } from "@/lib/auth/actingUser";
import { ProfileEditForm } from "./ProfileEditForm";

/**
 * Edit profile page. Auth enforced by (app)/layout.
 * Loads `profiles` for the effective user (matches app shell).
 */
export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const session = await getEffectiveSession();
  const profileUserId = session?.effectiveUserId ?? user.id;

  type ProfileRow = {
    full_name?: string | null;
    state?: string | null;
    location?: string | null;
    professional_summary?: string | null;
    headline?: string | null;
  };

  let profile: ProfileRow | null = null;
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, state, location, professional_summary, headline")
    .eq("id", profileUserId)
    .maybeSingle();

  if (profileError) {
    console.warn("[profile/edit] profiles lookup:", profileError.message);
  } else {
    profile = profileRow as ProfileRow | null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Edit Profile
      </h1>
      <ProfileEditForm
        defaultValues={{
          full_name: profile?.full_name ?? "",
          headline: profile?.headline ?? "",
          location: (profile?.location ?? profile?.state ?? "").trim(),
          professional_summary: profile?.professional_summary ?? "",
        }}
      />
    </div>
  );
}
