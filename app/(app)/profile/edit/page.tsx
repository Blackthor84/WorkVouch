import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileRowForUser } from "@/lib/profile/ensureUserProfile";
import { ProfileEditForm } from "./ProfileEditForm";

/**
 * Edit profile page. Auth enforced by (app)/layout.
 * Loads `profiles` for `user.id` (creates stub row if missing).
 */
export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfileRowForUser(user);

  type ProfileRow = {
    full_name?: string | null;
    state?: string | null;
    location?: string | null;
    professional_summary?: string | null;
    headline?: string | null;
  };

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, state, location, professional_summary, headline")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.warn("[profile/edit] profiles lookup:", profileError.message);
  }

  const profile = (profileRow ?? null) as ProfileRow | null;

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
