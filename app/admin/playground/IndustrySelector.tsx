"use client";

import { ALL_INDUSTRIES, type Industry } from "@/lib/industries";

type Props = {
  value: Industry | string;
  onChange: (value: Industry) => void;
};

export function IndustrySelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Industry)}
      className="border rounded px-3 py-2 text-sm"
    >
      {ALL_INDUSTRIES.map((i) => (
        <option key={i} value={i}>
          {i.replace("_", " ").toUpperCase()}
        </option>
      ))}
    </select>
  );
}
