import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("verification_requests")
    .select("job_id, target_email, status")
    .eq("response_token", token)
    .maybeSingle();

  if (!request || (request as { status?: string }).status !== "pending") {
    return (
      <div className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Invalid or expired link</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This verification link is invalid or has already been used.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  const jobId = (request as { job_id?: string }).job_id;
  const { data: job } = jobId
    ? await supabase
        .from("jobs")
        .select("company_name, title")
        .eq("id", jobId)
        .maybeSingle()
    : { data: null };

  const companyName = (job as { company_name?: string } | null)?.company_name ?? "the company";
  const jobTitle = (job as { title?: string } | null)?.title;

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Confirm Employment</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        Did you work with this person at this company?
        <span className="block mt-2 font-medium text-gray-900 dark:text-white">
          {companyName}
          {jobTitle ? ` — ${jobTitle}` : ""}
        </span>
      </p>

      <form action={`/api/verify/coworker/${encodeURIComponent(token)}`} method="POST">
        <button
          type="submit"
          className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
        >
          Yes, we worked together
        </button>
      </form>
    </div>
  );
}
