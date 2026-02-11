import { Card, CardContent } from "@/components/ui/card";

export default function RealExampleSection() {
  return (
    <section className="bg-slate-50 dark:bg-slate-800/40 border-y border-slate-200 dark:border-slate-700 py-16" id="see-how-it-works">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl mb-10">
          See How It Works
        </h2>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <Card className="flex-shrink-0 w-full md:max-w-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827]">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Example profile</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sarah Thompson</h3>
              <p className="text-slate-600 dark:text-slate-300 mt-1">Healthcare</p>
              <dl className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Reputation Score</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">87</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Verified Jobs</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">4</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Peer References</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">6</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Rehire Eligible</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">Yes</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Why this matters to employers
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              This score reflects verified job overlap, peer confirmation, reference quality, and profile strength. You see real data, not just claims.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
