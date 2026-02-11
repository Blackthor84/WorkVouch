import { ShieldCheckIcon } from "@heroicons/react/24/outline";

const BULLETS = [
  "One review per verified overlap",
  "Self-reviews blocked",
  "Duplicate prevention",
  "AI-derived sentiment",
  "Employment verification requirements",
];

export default function WhyWorkVouch() {
  return (
    <section className="bg-white border-y border-[#E2E8F0] py-20" id="why-workvouch">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheckIcon className="h-10 w-10 text-emerald-600" aria-hidden />
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A]">
            Fraud-Resistant by Design
          </h2>
        </div>
        <ul className="space-y-3 text-[#334155]">
          {BULLETS.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-10 text-xl font-semibold text-[#0F172A]">
          Trust should be verified.
        </p>
      </div>
    </section>
  );
}
