"use client";

import { type ReactNode } from "react";

type Props = { feature: string; children?: ReactNode; unlocked?: boolean };

export default function EnterpriseLock({ feature, children, unlocked }: Props) {
  if (unlocked && children) return <>{children}</>;
  return (
    <div className="border-2 border-dashed border-yellow-400 p-4 bg-yellow-50">
      <h3 className="font-semibold">Enterprise Feature</h3>
      <p className="text-sm text-gray-700">
        {feature} is available on the Enterprise plan.
      </p>
      <button className="mt-2 bg-black text-white px-3 py-1 rounded">
        Request Enterprise Access
      </button>
    </div>
  );
}
