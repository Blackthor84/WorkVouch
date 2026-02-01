import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrustProfilePreview } from "@/components/profile";

export default function PreviewCards() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
      <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl mb-12">
        See What You Get
      </h2>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex justify-center lg:justify-start">
          <TrustProfilePreview className="w-full max-w-md" />
        </div>
        <Card className="border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="pb-2">
            <span className="font-semibold text-slate-900 dark:text-white">Employer View</span>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-600 dark:text-slate-400">
            <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 text-sm">
              <span className="text-slate-500 dark:text-slate-500">Risk snapshot</span>
              <p className="mt-1 text-slate-700 dark:text-slate-300">Summary card placeholder</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 text-sm">
              <span className="text-slate-500 dark:text-slate-500">Workforce overview</span>
              <p className="mt-1 text-slate-700 dark:text-slate-300">Overview placeholder</p>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 text-sm">
              <span className="text-slate-500 dark:text-slate-500">Rehire registry</span>
              <p className="mt-1 text-slate-700 dark:text-slate-300">Preview placeholder</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
