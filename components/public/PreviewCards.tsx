import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PreviewCards() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
      <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl mb-12">
        See What You Get
      </h2>
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-slate-200 dark:border-slate-700 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">Sample Profile</span>
              <Badge variant="success">Verified</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-4 text-sm">
              <span>References</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">3</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span>Trust score</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">—</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
              Placeholder for employee trust profile preview.
            </p>
          </CardContent>
        </Card>
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
