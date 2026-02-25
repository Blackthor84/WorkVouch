"use client";

type EmployerImpactProps = {
  result: any;
  view: "employer" | "candidate";
  threshold?: number;
};

export default function EmployerImpact({
  result,
  view,
  threshold = 70,
}: EmployerImpactProps) {
  if (!result) return null;

  return (
    <div className="rounded bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white">
        {view === "employer" ? "What This Means for Employers" : "What This Means for You"}
      </h3>

      {view === "employer" ? (
        <ul className="list-disc ml-5 mt-2 text-sm text-red-700 dark:text-red-400 space-y-1">
          <li>Candidate visibility reduced</li>
          <li>Hiring risk increased</li>
          <li>Additional verification recommended</li>
        </ul>
      ) : (
        <ul className="list-disc ml-5 mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>Your profile trust changed based on coworker feedback</li>
          <li>Adding verified coworkers can improve your score</li>
          <li>No automated rejection occurred</li>
        </ul>
      )}
    </div>
  );
}
