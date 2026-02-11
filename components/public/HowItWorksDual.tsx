import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HowItWorksDual() {
  const employeeItems = [
    "Verify past roles",
    "Collect coworker references",
    "Build reputation score",
    "Control who sees your Verified Work Profile",
  ];
  const employerItems = [
    "Request a Verified Work Profile",
    "Verify before you hire",
    "Structured, privacy-first verification",
    "No public job board—verified identity only",
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
      <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        How It Works
      </h2>
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">For Employees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600 dark:text-slate-400">
            <ul className="list-none space-y-3">
              {employeeItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  {item}
                </li>
              ))}
            </ul>
            <Button href="/signup?type=employee" variant="primary" size="md" className="mt-4">
              Build Your Verified Profile
            </Button>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">For Employers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600 dark:text-slate-400">
            <ul className="list-none space-y-3">
              {employerItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            <Button href="/signup" variant="secondary" size="md" className="mt-4">
              Explore Employer Tools
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
