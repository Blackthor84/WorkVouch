import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./ProfileEditForm";

/**
 * Edit profile page. Auth enforced by (app)/layout.
 */
export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profile: { full_name?: string | null; state?: string | null; professional_summary?: string | null; headline?: string | null } | null = null;
  try {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("full_name, state, professional_summary, headline")
      .eq("id", user.id)
      .maybeSingle();
    profile = profileRow as typeof profile;
  } catch {
    // ignore missing columns / schema mismatch
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
          location: profile?.state ?? "",
          bio: profile?.professional_summary ?? "",
        }}
      />
    </div>
  );
}
