import { Button } from "@/components/ui/button";

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
      <h2 className="text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl">
        Get started today
      </h2>
      <p className="mt-4 text-base text-[#334155] md:text-lg">
        Build your verified profile or start hiring with confidence.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4">
        <Button href="/signup?type=employee" variant="primary" size="lg" className="w-full sm:w-auto">
          Build Your Verified Profile
        </Button>
        <Button href="/signup" variant="secondary" size="lg" className="w-full sm:w-auto">
          Start Hiring Smarter
        </Button>
      </div>
    </section>
  );
}
