"use client";

import { getVerticalOnboardingConfig } from "@/lib/verticals/onboarding";
import { DynamicFieldRenderer } from "./DynamicFieldRenderer";

export type VerticalFieldValues = Record<string, string | number | string[]>;

interface VerticalOnboardingFieldsProps {
  industry: string | null | undefined;
  value: VerticalFieldValues;
  onChange: (values: VerticalFieldValues) => void;
  /** When true, only render employee fields (default). */
  mode?: "employee" | "employer";
  className?: string;
}

export function VerticalOnboardingFields({
  industry,
  value,
  onChange,
  mode = "employee",
  className = "",
}: VerticalOnboardingFieldsProps) {
  const config = getVerticalOnboardingConfig(industry);
  if (!config) return null;

  const fields = mode === "employee" ? config.employeeFields : config.employerFields ?? [];
  if (fields.length === 0) return null;

  const handleChange = (key: string, val: string | number | string[]) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <p className="text-sm font-medium text-slate-200">
        {config.industry} details
      </p>
      {fields.map((field) => (
        <DynamicFieldRenderer
          key={field.key}
          field={field}
          value={value[field.key]}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}
