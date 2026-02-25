"use client";

export type PlaygroundView = "employer" | "candidate";

type Props = {
  value: PlaygroundView;
  onChange: (value: PlaygroundView) => void;
};

export default function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-100 dark:bg-gray-800">
      <button
        type="button"
        onClick={() => onChange("employer")}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          value === "employer"
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        Employer View
      </button>
      <button
        type="button"
        onClick={() => onChange("candidate")}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          value === "candidate"
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        Candidate View
      </button>
    </div>
  );
}
