import { Button } from "@/components/ui/button";

export function EmployerProfilePaywall({
  viewsToday,
  limit,
}: {
  viewsToday: number;
  limit: number;
}) {
  return (
    <div className="max-w-lg mx-auto mt-16 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg text-center">
      <h1 className="text-xl font-bold text-slate-900">Daily profile limit reached</h1>
      <p className="mt-2 text-slate-600">
        You have viewed <strong>{viewsToday}</strong> of <strong>{limit}</strong> profiles today on the free plan.
      </p>
      <p className="mt-4 text-sm text-slate-500">
        Upgrade for unlimited views, full trust scores, and complete reference access.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button href="/employer/upgrade">Upgrade plan</Button>
        <Button variant="secondary" href="/employer/dashboard">
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
