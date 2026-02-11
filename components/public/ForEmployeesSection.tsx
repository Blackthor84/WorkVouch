import { Button } from "@/components/ui/button";

const BULLETS = [
  "Real coworkers",
  "Verified employment overlap",
  "Sentiment-based peer validation",
  "Industry-specific metrics",
];

export default function ForEmployeesSection() {
  return (
    <section className="py-16 md:py-20 bg-[#F8FAFC] overflow-x-hidden" id="for-employees">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl">
          Turn Your Work History Into Proof
        </h2>
        <p className="mt-6 max-w-3xl text-base text-[#334155] leading-relaxed md:text-lg">
          Your work speaks louder when it&apos;s verified.
        </p>
        <p className="mt-4 text-base text-[#334155]">
          Build a profile backed by:
        </p>
        <ul className="mt-4 space-y-2 list-disc list-inside text-[#334155]">
          {BULLETS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-6 text-base text-[#334155]">
          Your profile evolves as your career grows.
        </p>
        <p className="mt-2 text-base text-[#0F172A] font-medium">
          This isn&apos;t a résumé.<br />It&apos;s your verified work identity.
        </p>
        <div className="mt-10">
          <Button href="/signup?type=employee" variant="primary" size="lg" className="w-full md:w-auto">
            Create Your Profile
          </Button>
        </div>
      </div>
    </section>
  );
}
