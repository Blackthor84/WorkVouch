import { createServerSupabase } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export async function TrustScoreCard({ userId }: { userId: string }) {
  const supabase = await createServerSupabase();
  const supabaseAny = supabase as any;
  const { data: trustScore } = await supabaseAny
    .from("trust_scores")
    .select("*")
    .eq("user_id", userId)
    .single();

  const score = (trustScore as any)?.score || 0;
  const getScoreColor = (score: number) => {
    if (score < 300) return "text-red-500";
    if (score < 600) return "text-yellow-500";
    if (score < 800) return "text-blue-500";
    return "text-green-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score < 300) return "bg-red-500";
    if (score < 600) return "bg-yellow-500";
    if (score < 800) return "bg-blue-500";
    return "bg-green-500";
  };

  const getScoreLabel = (score: number) => {
    if (score < 300) return "Needs Improvement";
    if (score < 600) return "Fair";
    if (score < 800) return "Good";
    return "Excellent";
  };

  return (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${getScoreBgColor(score)}`}
      ></div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Trust Score</CardTitle>
          <button
            className="text-grey-medium dark:text-gray-400 hover:text-grey-medium dark:text-gray-400 transition-colors"
            title="What affects your Trust Score?"
          >
            <InformationCircleIcon className="h-5 w-5" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {trustScore ? (
          <div className="space-y-6">
            {/* Circular Gauge */}
            <div className="flex items-center justify-center">
              <div className="relative h-40 w-40">
                <svg className="transform -rotate-90 h-40 w-40">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-grey-light"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(score / 1000) * 439.8} 439.8`}
                    className={`${getScoreColor(score)} transition-all duration-1000`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className={`text-4xl font-bold ${getScoreColor(score)}`}
                    >
                      {Math.round(score)}
                    </div>
                    <div className="text-xs text-grey-dark dark:text-gray-200 font-semibold mt-1">
                      out of 1000
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Label */}
            <div className="text-center">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getScoreBgColor(score)}/10`}
              >
                <div
                  className={`h-2 w-2 rounded-full ${getScoreBgColor(score)}`}
                ></div>
                <span
                  className={`text-sm font-semibold ${getScoreColor(score)}`}
                >
                  {getScoreLabel(score)}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 pt-4 border-t border-grey-background dark:border-[#374151]">
              <div className="flex justify-between items-center">
                <span className="text-sm text-grey-dark dark:text-gray-200 font-semibold">
                  Jobs
                </span>
                <span className="text-sm font-bold text-grey-dark dark:text-gray-200">
                  {(trustScore as any)?.job_count || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-grey-dark dark:text-gray-200 font-semibold">
                  References
                </span>
                <span className="text-sm font-bold text-grey-dark dark:text-gray-200">
                  {(trustScore as any)?.reference_count || 0}
                </span>
              </div>
              {(trustScore as any)?.average_rating && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-grey-dark dark:text-gray-200 font-semibold">
                    Avg Rating
                  </span>
                  <span className="text-sm font-bold text-grey-dark dark:text-gray-200">
                    {((trustScore as any)?.average_rating || 0).toFixed(1)} /
                    5.0
                  </span>
                </div>
              )}
            </div>

            {/* Trust Score History Placeholder */}
            <div className="pt-4 border-t border-grey-background dark:border-[#374151]">
              <p className="text-xs text-grey-dark dark:text-gray-200 font-semibold mb-2">
                Score History
              </p>
              <div className="h-16 bg-grey-background dark:bg-[#111827] rounded-lg flex items-end justify-center gap-1 p-2">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/30 rounded-t transition-all hover:bg-primary/50"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-grey-dark dark:text-gray-200 font-bold mb-4">
              No trust score calculated yet.
            </p>
            <p className="text-xs text-grey-dark dark:text-gray-200 font-semibold">
              Add jobs and request references to build your score.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
