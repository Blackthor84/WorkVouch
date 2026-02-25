"use client";

type Props = { result: any };

export default function ScenarioResult({ result }: Props) {
  if (!result) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{result.title}</h2>
        <p className="text-gray-600">{result.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Metric label="Trust Score" before={result.before?.trustScore} after={result.after?.trustScore} />
        <Metric label="Profile Strength" before={result.before?.profileStrength} after={result.after?.profileStrength} />
      </div>
    </div>
  );
}

function Metric({ label, before, after }: any) {
  const delta = after != null && before != null ? after - before : 0;
  return (
    <div className="border rounded p-4">
      <h4 className="font-medium">{label}</h4>
      <p className="text-sm text-gray-500">
        {before} → <strong>{after}</strong>{" "}
        <span className={delta >= 0 ? "text-green-600" : "text-red-600"}>
          ({delta >= 0 ? "+" : ""}{delta})
        </span>
      </p>
    </div>
  );
}
