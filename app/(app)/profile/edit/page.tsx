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

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name, city, state, industry, professional_summary")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow as {
    full_name?: string | null;
    city?: string | null;
    state?: string | null;
    industry?: string | null;
    professional_summary?: string | null;
  } | null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Edit Profile
      </h1>
      <ProfileEditForm
        defaultValues={{
          full_name: profile?.full_name ?? "",
          headline: profile?.industry ?? "",
          location: [profile?.city ?? "", profile?.state ?? ""].filter(Boolean).join(", "),
          bio: profile?.professional_summary ?? "",
        }}
      />
    </div>
  );
}
