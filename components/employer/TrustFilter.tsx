"use client";

type Props = {
  value: number;
  onChange: (minTrust: number) => void;
  className?: string;
};

/**
 * Minimum trust score filter (0–100) for candidate exploration.
 */
export function TrustFilter({ value, onChange, className = "" }: Props) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/40 ${className}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-grey-dark dark:text-gray-200">
            Minimum trust score
          </p>
          <p className="text-xs text-grey-medium dark:text-gray-400 mt-0.5">
            Show candidates at or above this WorkVouch trust level (0–100).
          </p>
        </div>
        <div className="flex items-center gap-3 min-w-[200px]">
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 accent-blue-600"
            aria-label="Minimum trust score"
          />
          <span className="tabular-nums text-sm font-medium text-grey-dark dark:text-gray-200 w-8 text-right">
            {value}
          </span>
        </div>
      </div>
    </div>
  );
}
