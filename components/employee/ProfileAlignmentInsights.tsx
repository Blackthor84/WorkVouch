"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

/**
 * Employee-facing alignment insights. Positive framing only.
 * No risk/delta language, no comparative data, no team comparison.
 * Shows verified employment strength, reference coverage, tenure — never "risk" or "fraud".
 */

interface ProfileAlignmentInsightsProps {
  /** Verified employment count (from reputation score or profile). */
  verifiedCount?: number;
  /** Total verified years (tenure). */
  totalYears?: number;
  /** Reference count. */
  referenceCount?: number;
  /** Average reference rating (e.g. 4.2). */
  avgRating?: number;
}

export function ProfileAlignmentInsights({
  verifiedCount = 0,
  totalYears = 0,
  referenceCount = 0,
  avgRating = 0,
}: ProfileAlignmentInsightsProps) {
  const insights: { label: string; value: string; positive: boolean }[] = [];
  if (verifiedCount > 0) {
    insights.push({
      label: "Verified employment strength",
      value: `${verifiedCount} role${verifiedCount !== 1 ? "s" : ""} verified`,
      positive: true,
    });
  }
  if (totalYears > 0) {
    insights.push({
      label: "Tenure strength",
      value: `${totalYears} year${totalYears !== 1 ? "s" : ""} of verified experience`,
      positive: true,
    });
  }
  if (referenceCount > 0) {
    insights.push({
      label: "Reference coverage",
      value: `${referenceCount} peer reference${referenceCount !== 1 ? "s" : ""}`,
      positive: true,
    });
  }
  if (avgRating > 0) {
    insights.push({
      label: "Peer validation",
      value: `${avgRating.toFixed(1)}/5 average rating`,
      positive: true,
    });
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile strengths</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-grey-medium dark:text-gray-400">
            Add verified employment and references to see your profile strengths here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profile strengths</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insights.map((item) => (
            <li key={item.label} className="flex items-center gap-3 text-sm">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
              <div>
                <span className="font-medium text-grey-dark dark:text-gray-200">{item.label}</span>
                <span className="text-grey-medium dark:text-gray-400 ml-2">{item.value}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
