import { createServerSupabase } from "@/lib/supabase/server";
import { getTrustScoreComponents } from "@/lib/trustScore";
import type { TrustScoreComponents } from "@/lib/trustScore";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

const MAX_SCORE = 100;

function getScoreColor(score: number) {
  if (score < 40) return "text-red-500";
  if (score < 60) return "text-amber-500";
  if (score < 80) return "text-blue-500";
  return "text-green-500";
}

function getScoreBgColor(score: number) {
  if (score < 40) return "bg-red-500";
  if (score < 60) return "bg-amber-500";
  if (score < 80) return "bg-blue-500";
  return "bg-green-500";
}

function getScoreLabel(score: number) {
  if (score < 40) return "Needs Improvement";
  if (score < 60) return "Fair";
  if (score < 80) return "Good";
  return "Excellent";
}

function getImprovementGuidance(components: TrustScoreComponents): string | null {
  if (components.verifiedEmployments < 2) return "Additional confirmed employment may strengthen your profile.";
  if (components.referenceCount === 0) return "Confirming coworker matches and receiving references can improve your score.";
  if (components.uniqueEmployersWithReferences < 2 && components.referenceCount > 0)
    return "References from more employers can strengthen your profile.";
  if (components.totalVerifiedYears < 1) return "Longer verified tenure can help employers see your experience.";
  return null;
}

export async function TrustScoreCard({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();
  const { data: trustScoreRow } = await (supabase as any)
    .from("trust_scores")
    .select("score, job_count, reference_count, average_rating")
    .eq("user_id", userId)
    .single();
  const score = Number((trustScoreRow as { score?: number } | null)?.score ?? 0);
  const components = await getTrustScoreComponents(userId);
  const guidance = getImprovementGuidance(components);
  const hasScore = score > 0 || components.referenceCount > 0 || components.verifiedEmployments > 0;

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${getScoreBgColor(score)}`} />
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Trust Score</CardTitle>
          <span className="text-grey-medium dark:text-gray-400" title="Portable core score (0–100)">
            <InformationCircleIcon className="h-5 w-5" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {hasScore ? (
          <div className="space-y-6">
            {/* Core score: 0–100 */}
            <div className="flex justify-center">
              <div className="relative h-40 w-40">
                <svg className="transform -rotate-90 h-40 w-40">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="none" className="text-grey-light dark:text-gray-700" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(score / MAX_SCORE) * 439.8} 439.8`}
                    className={`${getScoreColor(score)} transition-all duration-1000`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getScoreColor(score)}`}>{Math.round(score)}</div>
                    <div className="text-xs text-grey-dark dark:text-gray-200 font-semibold mt-1">out of 100</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getScoreBgColor(score)}/10`}>
                <span className={`h-2 w-2 rounded-full ${getScoreBgColor(score)}`} />
                <span className={`text-sm font-semibold ${getScoreColor(score)}`}>{getScoreLabel(score)}</span>
              </span>
            </div>

            {/* Breakdown — no weights, no raw math */}
            <div className="space-y-3 pt-4 border-t border-grey-background dark:border-[#374151]">
              <div className="flex justify-between items-center">
                <span className="text-sm text-grey-dark dark:text-gray-200 font-medium">Verified Employment</span>
                <span className="text-sm font-semibold text-grey-dark dark:text-gray-200">
                  {components.verifiedEmployments} confirmed role{components.verifiedEmployments !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-grey-dark dark:text-gray-200 font-medium">Tenure Strength</span>
                <span className="text-sm font-semibold text-grey-dark dark:text-gray-200">
                  {components.totalVerifiedYears < 0.1 ? "—" : `${components.totalVerifiedYears.toFixed(1)} year${components.totalVerifiedYears !== 1 ? "s" : ""} verified`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-grey-dark dark:text-gray-200 font-medium">Peer Validation</span>
                <span className="text-sm font-semibold text-grey-dark dark:text-gray-200">
                  {components.referenceCount} reference{components.referenceCount !== 1 ? "s" : ""}
                  {components.referenceCount > 0 ? ` · ${components.averageReferenceRating.toFixed(1)}/5 avg` : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-grey-dark dark:text-gray-200 font-medium">Reference Distribution</span>
                <span className="text-sm font-semibold text-grey-dark dark:text-gray-200">
                  {components.uniqueEmployersWithReferences} unique employer{components.uniqueEmployersWithReferences !== 1 ? "s" : ""} validated
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-grey-dark dark:text-gray-200 font-medium">Fraud Indicators</span>
                <span className="text-sm font-semibold text-grey-dark dark:text-gray-200">
                  {components.fraudFlagsCount === 0 ? "None" : `${components.fraudFlagsCount} flagged`}
                </span>
              </div>
            </div>

            {guidance && (
              <p className="text-xs text-grey-medium dark:text-gray-400 pt-2 border-t border-grey-background dark:border-[#374151]">
                {guidance}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-grey-dark dark:text-gray-200 font-bold mb-4">No trust score calculated yet.</p>
            <p className="text-xs text-grey-dark dark:text-gray-200 font-medium">
              Add confirmed employment and references to build your score.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
