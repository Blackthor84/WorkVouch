"use client";

type Props = {
  threshold: number;
  setThreshold: (n: number) => void;
};

export default function TrustThreshold({ threshold, setThreshold }: Props) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg bg-white dark:bg-gray-900/50">
      <h3 className="font-semibold text-gray-900 dark:text-white">Employer Trust Requirement</h3>
      <input
        type="range"
        min={0}
        max={100}
        value={threshold}
        onChange={(e) => setThreshold(Number(e.target.value))}
        className="w-full mt-2 accent-blue-600"
      />
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Threshold: {threshold}</p>
    </div>
  );
}
