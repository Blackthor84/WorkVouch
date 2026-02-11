import { Button } from "@/components/ui/button";

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        Get started today
      </h2>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
        Build your verified profile or start hiring with confidence.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button href="/signup?type=employee" variant="primary" size="lg">
          Build Your Verified Profile
        </Button>
        <Button href="/signup" variant="secondary" size="lg">
          Start Hiring Smarter
        </Button>
      </div>
    </section>
  );
}
