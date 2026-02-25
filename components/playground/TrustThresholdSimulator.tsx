"use client";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export default function TrustThresholdSimulator({
  value,
  onChange,
  min = 0,
  max = 100,
}: Props) {
  return (
    <div className="space-y-2">
      <label className="block font-medium text-gray-900 dark:text-white">
        Employer Trust Requirement
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 accent-blue-600"
        />
        <span className="text-sm font-mono text-gray-700 dark:text-gray-300 w-10">
          {value}
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Candidates below this score show risk warnings in employer view.
      </p>
    </div>
  );
}
