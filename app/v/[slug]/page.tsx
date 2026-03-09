import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PublicProfile({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const supabaseAny = supabase as any;

  const isUuid = UUID_REGEX.test(slug);
  const profileQuery = isUuid
    ? supabase.from("profiles").select("id, full_name, industry, profile_photo_url, professional_summary").eq("id", slug).maybeSingle()
    : supabaseAny.from("profiles").select("id, full_name, industry, profile_photo_url, professional_summary").eq("passport_username", slug).maybeSingle();

  const { data: profile } = await profileQuery;

  if (!profile) {
    notFound();
  }

  const profileId = (profile as { id: string }).id;

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, company_name, title, start_date, end_date, is_current, location")
    .eq("user_id", profileId)
    .eq("verification_status", "verified")
    .eq("is_private", false)
    .order("start_date", { ascending: false });

  let confidenceScore: number | null = null;
  try {
    const { data: csRow } = await supabaseAny
      .from("user_confidence_scores")
      .select("confidence_score")
      .eq("user_id", profileId)
      .maybeSingle();
    confidenceScore = (csRow as { confidence_score?: number } | null)?.confidence_score ?? null;
  } catch {
    // view may not exist
  }

  const jobList = (jobs ?? []) as Array<{
    id: string;
    company_name: string;
    title: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    location: string | null;
  }>;

  const fullName = (profile as { full_name?: string }).full_name ?? "Profile";
  const industry = (profile as { industry?: string | null }).industry;
  const summary = (profile as { professional_summary?: string | null }).professional_summary;

  return (
    <div className="max-w-4xl mx-auto p-8 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {fullName}
        </h1>
        {industry && (
          <p className="text-gray-500 dark:text-gray-400 mt-1">{industry}</p>
        )}
        {confidenceScore !== null && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Confidence Score: <strong>{confidenceScore}</strong>
          </p>
        )}
        {summary && (
          <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl">
            {summary}
          </p>
        )}
      </div>

      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Verified Work History
      </h2>

      {jobList.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No verified work history yet.</p>
      ) : (
        <ul className="space-y-4">
          {jobList.map((job) => (
            <li
              key={job.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900/50"
            >
              <div className="font-semibold text-gray-900 dark:text-white">
                {job.company_name}
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                {job.title}
              </div>
              {job.location && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {job.location}
                </div>
              )}
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {job.is_current
                  ? "Current"
                  : `${job.start_date.slice(0, 7)} – ${job.end_date ? job.end_date.slice(0, 7) : "—"}`}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm text-gray-500">
        <Link href="/" className="text-blue-600 hover:underline dark:text-blue-400">
          ← WorkVouch
        </Link>
      </p>
    </div>
  );
}
