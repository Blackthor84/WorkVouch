import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase-admin";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EnvelopeIcon } from "@heroicons/react/24/outline";

/**
 * Shows verification requests the current user sent (pending coworker responses).
 * Uses verification_requests where requester is current user; joins jobs for label.
 */
export async function VerificationRequests({ profileId }: { profileId: string }) {
  const supabase = await createClient();
  const adminAny = admin as any;

  const { data: rows } = await adminAny
    .from("verification_requests")
    .select("id, job_id, employment_record_id, target_email, status, created_at")
    .eq("requester_profile_id", profileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  const list = (rows ?? []) as Array<{
    id: string;
    job_id: string | null;
    employment_record_id: string | null;
    target_email: string;
    status: string;
    created_at: string;
  }>;

  const jobIds = [...new Set(list.map((r) => r.job_id).filter(Boolean))] as string[];
  const jobMap = new Map<string, { company_name: string; title: string }>();
  if (jobIds.length > 0) {
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, company_name, title")
      .in("id", jobIds);
    for (const j of jobs ?? []) {
      const row = j as { id: string; company_name: string; title: string };
      jobMap.set(row.id, { company_name: row.company_name, title: row.title });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <EnvelopeIcon className="h-5 w-5" />
          Verification Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {list.length === 0 ? (
          <p className="text-sm text-gray-500">
            No pending requests. Add a job and invite coworkers to verify.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((r) => (
              <li key={r.id} className="text-sm flex items-center justify-between gap-2">
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  {r.target_email}
                </span>
                <span className="text-gray-400 text-xs flex-shrink-0">Pending</span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/coworker-matches"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          Manage requests →
        </Link>
      </CardContent>
    </Card>
  );
}
