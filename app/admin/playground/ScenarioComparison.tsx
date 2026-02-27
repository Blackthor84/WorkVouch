"use client";

type Snapshot = { addedReviews: unknown[]; removedReviewIds: string[]; thresholdOverride?: number };

export function ScenarioComparison({ history }: { history: Snapshot[] }) {
  if (history.length < 2) return null;

  const before = history[0];
  const after = history[history.length - 1];

  return (
    <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Scenario Comparison</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="font-medium text-slate-700 mb-1">Before</h3>
          <pre className="bg-slate-50 p-2 rounded overflow-auto max-h-48 text-xs">
            {JSON.stringify(before, null, 2)}
          </pre>
        </div>
        <div>
          <h3 className="font-medium text-slate-700 mb-1">After</h3>
          <pre className="bg-slate-50 p-2 rounded overflow-auto max-h-48 text-xs">
            {JSON.stringify(after, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
