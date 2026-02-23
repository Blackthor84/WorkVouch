"use client";

type RiskExplanationProps = {
  flags: string[];
};

/** “Why This User Is Risky” panel — investor-facing risk indicators. */
export function RiskExplanation({ flags }: RiskExplanationProps) {
  if (!flags?.length) return null;

  return (
    <div className="rounded bg-yellow-100 p-4">
      <h4 className="font-bold">Risk Indicators</h4>
      <ul className="mt-1 list-inside list-disc text-sm">
        {flags.map((f) => (
          <li key={f}>• {f.replace(/_/g, " ")}</li>
        ))}
      </ul>
    </div>
  );
}
