"use client";

import { Card } from "@/components/ui/card";
import { SparklesIcon } from "@heroicons/react/24/solid";

type ValueBlock = { title: string; body: string; roi: string };

type ValueSectionProps = {
  blocks: ValueBlock[];
  heading?: string;
};

export function ValueSection({
  blocks,
  heading = "How WorkVouch Creates Value",
}: ValueSectionProps) {
  return (
    <section className="mt-10 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-5">
        <SparklesIcon className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">{heading}</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {blocks.map((block) => (
          <Card key={block.title} className="border-blue-100/80 bg-white/90 shadow-sm">
            <p className="font-semibold text-gray-900">{block.title}</p>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{block.body}</p>
            <p className="mt-3 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 inline-block">
              ROI: {block.roi}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
