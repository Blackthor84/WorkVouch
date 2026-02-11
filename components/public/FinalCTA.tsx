import { Button } from "@/components/ui/button";

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
      <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-8">
        WorkVouch is building the trust layer for modern employment.
      </p>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        Verified Employment. Real Intelligence.
      </h2>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
        Create your Verified Work Profile or request verification as an employer.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button href="/signup?type=employee" variant="primary" size="lg">
          Build Your Verified Work Profile
        </Button>
        <Button href="/signup" variant="secondary" size="lg">
          Explore Employer Tools
        </Button>
      </div>
    </section>
  );
}
