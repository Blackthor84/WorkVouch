"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VerticalOnboardingField } from "@/lib/verticals/onboarding";

const inputClass =
  "w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

interface DynamicFieldRendererProps {
  field: VerticalOnboardingField;
  value: string | number | string[] | undefined;
  onChange: (key: string, value: string | number | string[]) => void;
  className?: string;
}

export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  className = "",
}: DynamicFieldRendererProps) {
  const id = `vertical-${field.key}`;
  const raw = value ?? (field.type === "multi-select" ? [] : "");

  if (field.type === "text") {
    return (
      <div className={className}>
        <Label htmlFor={id} className="font-semibold text-white">
          {field.label}
          {field.required && " *"}
        </Label>
        <Input
          id={id}
          type="text"
          required={field.required}
          value={(raw as string) || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={`mt-1 ${inputClass}`}
          placeholder={field.label}
        />
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div className={className}>
        <Label htmlFor={id} className="font-semibold text-white">
          {field.label}
          {field.required && " *"}
        </Label>
        <Input
          id={id}
          type="number"
          required={field.required}
          min={0}
          value={(raw as number) ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(field.key, v === "" ? 0 : Number(v));
          }}
          className={`mt-1 ${inputClass}`}
          placeholder={field.label}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className={className}>
        <Label htmlFor={id} className="font-semibold text-white">
          {field.label}
          {field.required && " *"}
        </Label>
        <select
          id={id}
          required={field.required}
          value={(raw as string) || ""}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={`mt-1 ${inputClass}`}
        >
          <option value="">—</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "multi-select") {
    const arr = (Array.isArray(raw) ? raw : []) as string[];
    const toggle = (opt: string) => {
      const next = arr.includes(opt) ? arr.filter((o) => o !== opt) : [...arr, opt];
      onChange(field.key, next);
    };
    return (
      <div className={className}>
        <Label className="font-semibold text-white">
          {field.label}
          {field.required && " *"}
        </Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={arr.includes(opt)}
                onChange={() => toggle(opt)}
                className="rounded border-slate-600 bg-slate-800"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
