"use client";

type Props = {
  departments: string[];
  roles: string[];
  onFilter: (key: "dept" | "role", value: string) => void;
};

export function Filters({ departments, roles, onFilter }: Props) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        onChange={(e) => onFilter("dept", e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="">All Departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        onChange={(e) => onFilter("role", e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="">All Roles</option>
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}
