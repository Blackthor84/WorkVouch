"use client";

export function ScenarioComparePanel(props: { left: any; right: any }) {
  const { left, right } = props;
  if (!left || !right) return null;
  return (
    <div className="flex flex-col md:flex-row gap-6 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Scenario A</h3>
        <pre className="text-xs bg-slate-50 p-3 rounded overflow-auto max-h-64">{JSON.stringify(left, null, 2)}</pre>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-slate-900 mb-2">Scenario B</h3>
        <pre className="text-xs bg-slate-50 p-3 rounded overflow-auto max-h-64">{JSON.stringify(right, null, 2)}</pre>
      </div>
    </div>
  );
}
