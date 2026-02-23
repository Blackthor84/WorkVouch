import { createServerSupabase, getSupabaseSession } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import VerticalBadges from "@/components/VerticalBadges";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";

export default async function EmployeePage(props: any) {
  const { employeeId } = await props.params;
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;

  try {
    const supabase = await createServerSupabase();
    const supabaseAny = supabase as any;

    // Fetch employee profile
    const { data: profile, error: profileError } = await supabaseAny
      .from("profiles")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (profileError || !profile) {
      notFound();
    }

    // Fetch employee's jobs
    const { data: jobs } = await supabaseAny
      .from("jobs")
      .select("*")
      .eq("user_id", employeeId)
      .order("start_date", { ascending: false });

    // Fetch references (vouches)
    const { data: references } = await supabaseAny
      .from("user_references")
      .select(`
        *,
        from_user:profiles!references_from_user_id_fkey (
          id,
          full_name,
          profile_photo_url
        ),
        job:jobs!references_job_id_fkey (
          id,
          company_name,
          job_title
        )
      `)
      .eq("to_user_id", employeeId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {profileWithScenario.profile_photo_url ? (
              <Image
                src={profileWithScenario.profile_photo_url}
                alt={profileWithScenario.full_name || "Profile"}
                width={100}
                height={100}
                className="rounded-full"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-500">
                  {(profileWithScenario.full_name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{profileWithScenario.full_name || "Unknown Employee"}</h1>
              {profileWithScenario.email && (
                <p className="text-gray-600">{profileWithScenario.email}</p>
              )}
              {profileWithScenario.industry && (
                <p className="text-sm text-gray-500 mt-1">Industry: {profileWithScenario.industry}</p>
              )}
              <VerticalBadges
                profile={{
                  industry: profileWithScenario.industry,
                  vertical: profileWithScenario.vertical,
                  role: profileWithScenario.role,
                }}
              />
            </div>
          </div>

          {profileWithScenario.professional_summary && (
            <p className="text-gray-700 mb-4">{profileWithScenario.professional_summary}</p>
          )}

          {profileWithScenario.city && profileWithScenario.state && (
            <p className="text-sm text-gray-600">
              📍 {profileWithScenario.city}, {profileWithScenario.state}
            </p>
          )}
        </div>

        {/* Job History */}
        {jobs && jobs.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Work History</h2>
            <div className="space-y-4">
              {jobs.map((job: any) => (
                <div key={job.id} className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-lg">{job.job_title}</h3>
                  <p className="text-gray-600">{job.company_name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(job.start_date).toLocaleDateString()} -{" "}
                    {job.end_date ? new Date(job.end_date).toLocaleDateString() : "Present"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* References/Vouches */}
        {references && references.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">
              Vouches ({references.length})
            </h2>
            <div className="space-y-4">
              {references.map((ref: any) => (
                <div key={ref.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {ref.from_user?.profile_photo_url ? (
                      <Image
                        src={ref.from_user.profile_photo_url}
                        alt={ref.from_user.full_name || "User"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm">
                          {(ref.from_user?.full_name || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{ref.from_user?.full_name || "Anonymous"}</p>
                      {ref.job && (
                        <p className="text-sm text-gray-600">
                          {ref.job.job_title} at {ref.job.company_name}
                        </p>
                      )}
                    </div>
                  </div>
                  {ref.comment && (
                    <p className="text-gray-700 mt-2">{ref.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {resolvedSearchParams && (
          <div className="mt-8">
            <pre className="bg-gray-100 p-4 rounded text-sm">{JSON.stringify(resolvedSearchParams, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error fetching employee data:", error);
    notFound();
  }
}
