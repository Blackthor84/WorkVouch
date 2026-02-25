"use client";

type Props = {
  result: any;
  view: "employer" | "candidate";
  threshold?: number;
};

export default function EmployerImpact({ result, view, threshold = 60 }: Props) {
  if (!result) return null;

  const trustScore = result.after?.trustScore ?? 0;
  const belowThreshold = trustScore < threshold;

  return (
    <div className="rounded bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white">
        {view === "employer" ? "What This Means for Employers" : "What This Means for You"}
      </h3>

      {view === "employer" ? (
        belowThreshold ? (
          <ul className="list-disc ml-5 mt-2 text-sm text-red-700 dark:text-red-400 space-y-1">
            <li>Candidate will appear lower in search results</li>
            <li>Verification warning shown on profile</li>
            <li>Employer risk score increased</li>
            <li>Hiring confidence reduced; more checks recommended</li>
          </ul>
        ) : (
          <ul className="list-disc ml-5 mt-2 text-sm text-green-700 dark:text-green-400 space-y-1">
            <li>Candidate highlighted as verified</li>
            <li>Faster hiring decision likelihood</li>
            <li>Reduced background verification cost</li>
          </ul>
        )
      ) : (
        belowThreshold ? (
          <ul className="list-disc ml-5 mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <li>Your trust score is below this employer&apos;s requirement ({threshold})</li>
            <li>Add more verifications or explain gaps to improve visibility</li>
            <li>No punitive action; you can improve your profile</li>
          </ul>
        ) : (
          <ul className="list-disc ml-5 mt-2 text-sm text-green-700 dark:text-green-400 space-y-1">
            <li>You meet this employer&apos;s trust requirement</li>
            <li>Profile is likely to surface in search</li>
            <li>Consider adding more peer reviews to strengthen further</li>
          </ul>
        )
      )}
    </div>
  );
}
