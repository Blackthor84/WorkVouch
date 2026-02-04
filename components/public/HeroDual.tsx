import { Button } from "@/components/ui/button";

export default function HeroDual() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
        {/* Left — human / career focused */}
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-5xl xl:text-6xl">
            Trust Is Your Career Currency.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0">
            WorkVouch verifies work history, strengthens reputations, and helps companies hire with confidence.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <Button href="/signup?type=employee" variant="primary" size="lg">
              I&apos;m an Employee
            </Button>
            <Button href="/signup" variant="secondary" size="lg">
              I&apos;m an Employer
            </Button>
          </div>
        </div>
        {/* Right — business / analytics focused (visual balance) */}
        <div className="hidden lg:block" aria-hidden>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-8 h-64 flex items-center justify-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Career Trust + Workforce Intelligence
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
