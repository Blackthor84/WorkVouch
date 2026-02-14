import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEmploymentMatchesForUser } from "@/lib/actions/employmentMatches";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserGroupIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import { CoworkerMatchActions } from "./CoworkerMatchActions";

export default async function CoworkerMatchesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const employmentMatches = await getEmploymentMatchesForUser();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
          Coworker Matches
        </h1>
        <p className="text-grey-medium dark:text-gray-400">
          People you worked with at the same company. Confirm matches and leave or request reviews — all actions are optional and user-initiated.
        </p>
      </div>

      {employmentMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employmentMatches.map((match) => (
            <Card key={match.id} className="p-6">
              <p className="text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">
                You worked with{" "}
                <span className="font-semibold">
                  {match.other_user?.full_name || match.other_user?.email || "Unknown"}
                </span>{" "}
                at <span className="font-semibold">{match.company_name}</span>
              </p>
              <p className="text-xs text-grey-medium dark:text-gray-400 mb-4">
                Overlap: {match.overlap_start} – {match.overlap_end}
              </p>
              {match.match_status === "confirmed" && (
                <Badge variant="success" className="mb-4">
                  <CheckBadgeIcon className="h-4 w-4 mr-1" />
                  Confirmed
                </Badge>
              )}
              {match.match_status === "pending" && (
                <Badge variant="secondary" className="mb-4">
                  Pending
                </Badge>
              )}
              <CoworkerMatchActions
                matchId={match.id}
                matchStatus={match.match_status}
                employmentMatchId={match.id}
                otherUserId={match.other_user?.id ?? match.matched_user_id}
                isRecordOwner={match.is_record_owner}
              />
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <UserGroupIcon className="h-12 w-12 text-grey-medium dark:text-gray-400 mx-auto mb-4" />
          <p className="text-grey-medium dark:text-gray-400 mb-4">
            No coworker matches yet. Add your job history or upload a resume to find people you&apos;ve worked with.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button href="/dashboard/import-resume">Import resume</Button>
            <Button href="/profile" variant="secondary">Add job</Button>
          </div>
        </Card>
      )}
    </main>
  );
}
