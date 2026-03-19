import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getConfidenceScoreByUserId } from "@/lib/db/queries/getConfidenceScoreByUserId";
import { getVerifiedJobCountByUserId } from "@/lib/db/queries/getVerifiedJobCountByUserId";
import { getTrustForProfile, getUserReferences } from "@/lib/actions/referenceFeedback";
import { admin } from "@/lib/supabase-admin";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

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
    .select("full_name, email, state, industry, role, professional_summary, public_slug")
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

  const [confidenceScore, verifiedJobCount, trustForProfile, references] = await Promise.all([
    getConfidenceScoreByUserId(user.id),
    getVerifiedJobCountByUserId(user.id),
    getTrustForProfile(user.id),
    getUserReferences(user.id),
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
  const publicSlug = profile?.public_slug ?? null;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://workvouch.com");
  const publicProfileUrl = publicSlug ? `${baseUrl}/candidate/${publicSlug}` : null;
  const linkedInShareUrl = publicProfileUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicProfileUrl)}`
    : null;

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

      {/* Trust score + references */}
      <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Trust & References
        </h2>
        <div className="flex flex-wrap items-baseline gap-6 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trust Score</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-0.5">
              {trustForProfile.score > 0 ? (trustForProfile.score / 20).toFixed(1) : "—"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">out of 5 (from references)</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total References</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-0.5">
              {trustForProfile.totalReferences}
            </p>
          </div>
        </div>
        {references.length > 0 ? (
          <ul className="space-y-4">
            {references.map((ref) => (
              <li
                key={ref.id}
                className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-gray-50/50 dark:bg-gray-800/30"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500 font-medium">
                    {Array.from({ length: ref.rating }, (_, i) => (
                      <StarSolid key={i} className="h-5 w-5" />
                    ))}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {ref.author_name ?? "A coworker"}
                  </span>
                  {ref.company_name && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      @ {ref.company_name}
                    </span>
                  )}
                </div>
                {ref.feedback && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                    {ref.feedback}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(ref.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No references yet. Request references from your coworker matches to build your trust score.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/profile/edit"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
        >
          Edit Profile
        </Link>
        {linkedInShareUrl && (
          <a
            href={linkedInShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Share on LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}
