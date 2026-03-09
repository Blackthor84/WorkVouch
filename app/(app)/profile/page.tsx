import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getConfidenceScoreByUserId } from "@/lib/db/queries/getConfidenceScoreByUserId";
import { getVerifiedJobCountByUserId } from "@/lib/db/queries/getVerifiedJobCountByUserId";
import { admin } from "@/lib/supabase-admin";

/**
 * Profile page. Authentication is enforced by (app)/layout.tsx — redirect if no user.
 * Displays professional profile; no internal identifiers (e.g. User ID).
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name, email, city, state, industry, role, professional_summary, public_slug")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileRow as {
    full_name?: string | null;
    email?: string | null;
    city?: string | null;
    state?: string | null;
    industry?: string | null;
    role?: string | null;
    professional_summary?: string | null;
    public_slug?: string | null;
  } | null;

  const [confidenceScore, verifiedJobCount] = await Promise.all([
    getConfidenceScoreByUserId(user.id),
    getVerifiedJobCountByUserId(user.id),
  ]);

  let verifiedCoworkerCount = 0;
  try {
    const { count } = await (admin as any)
      .from("user_references")
      .select("id", { count: "exact", head: true })
      .eq("to_user_id", user.id);
    verifiedCoworkerCount = count ?? 0;
  } catch {
    // ignore
  }

  const fullName = profile?.full_name ?? "User";
  const headline = profile?.industry ?? profile?.role ?? null;
  const locationParts = [profile?.city, profile?.state].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(", ") : null;
  const email = profile?.email ?? user.email ?? "";
  const bio = profile?.professional_summary ?? null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Profile
      </h1>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6 space-y-4">
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Full Name
          </h2>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            {fullName}
          </p>
        </div>

        {headline && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Headline
            </h2>
            <p className="mt-1 text-gray-900 dark:text-white">{headline}</p>
          </div>
        )}

        {location && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Location
            </h2>
            <p className="mt-1 text-gray-900 dark:text-white">{location}</p>
          </div>
        )}

        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Email
          </h2>
          <p className="mt-1 text-gray-900 dark:text-white">
            <a
              href={`mailto:${email}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {email}
            </a>
          </p>
        </div>

        {bio && (
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Bio
            </h2>
            <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {bio}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              WorkVouch Confidence Score
            </h2>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {confidenceScore ?? "—"}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Verified Jobs
            </h2>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {verifiedJobCount}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Verified Coworkers
            </h2>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {verifiedCoworkerCount}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link
          href="/profile/edit"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
        >
          Edit Profile
        </Link>
      </div>
    </div>
  );
}
