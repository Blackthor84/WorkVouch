import { Button } from "@/components/ui/button";

const BULLETS = [
  "Verified tenure",
  "Peer review volume",
  "Behavioral sentiment",
  "Rating distribution",
  "Rehire eligibility",
  "Cross-role consistency",
];

export default function ForEmployersSection() {
  return (
    <section className="bg-[#F8FAFC] border-y border-[#E2E8F0] py-16 md:py-20 overflow-x-hidden" id="for-employers">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl">
          Hire With Confidence. Not Guesswork.
        </h2>
        <p className="mt-6 max-w-3xl text-base text-[#334155] leading-relaxed md:text-lg">
          WorkVouch replaces traditional references with verified coworker overlap and fraud-resistant peer validation.
        </p>
        <p className="mt-4 text-base text-[#334155]">
          Our intelligence engine analyzes:
        </p>
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 list-disc list-inside text-[#334155]">
          {BULLETS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl text-base text-[#334155] font-medium">
          All converted into a dynamic Employment Confidence Score.
        </p>
        <p className="mt-2 text-base text-[#334155]">
          You don&apos;t just see what someone claims.<br />You see how they performed.
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
