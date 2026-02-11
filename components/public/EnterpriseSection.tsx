import { Button } from "@/components/ui/button";

const BULLETS = [
  "Team confidence metrics",
  "Fraud detection signals",
  "Risk flags",
  "Hiring confidence analytics",
  "Reputation benchmarking",
];

export default function EnterpriseSection() {
  return (
    <section className="bg-white border-y border-[#E2E8F0] py-16 md:py-20 overflow-x-hidden" id="enterprise">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl">
          Enterprise Employment Intelligence
        </h2>
        <p className="mt-6 max-w-3xl text-base text-[#334155] leading-relaxed md:text-lg">
          For large organizations, WorkVouch delivers:
        </p>
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 list-disc list-inside text-[#334155]">
          {BULLETS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-8 text-base text-[#334155] font-medium">
          This is employment infrastructure. Not a review platform.
        </p>
        <div className="mt-10">
          <Button href="/signup" variant="primary" size="lg" className="w-full md:w-auto">
            Explore Employer Tools
          </Button>
        </div>
      </div>
    </section>
  );
}
