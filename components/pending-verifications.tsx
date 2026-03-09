import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase-admin";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClockIcon } from "@heroicons/react/24/outline";

/**
 * Pending Verifications — requests the current user sent (awaiting coworker response).
 */
export async function PendingVerifications({ profileId }: { profileId: string }) {
  const supabase = await createClient();
  const adminAny = admin as any;

  const { data: rows } = await adminAny
    .from("verification_requests")
    .select("id, job_id, target_email, status, created_at")
    .eq("requester_profile_id", profileId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  const list = (rows ?? []) as Array<{
    id: string;
    job_id: string | null;
    target_email: string;
    status: string;
    created_at: string;
  }>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          Pending Verifications
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
                <span className="text-amber-600 dark:text-amber-400 text-xs font-medium flex-shrink-0">
                  Pending
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/coworker-matches"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Manage requests →
        </Link>
      </CardContent>
    </Card>
  );
}
