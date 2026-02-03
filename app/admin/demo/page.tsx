import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BriefcaseIcon,
  UserCircleIcon,
  MegaphoneIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

const demos = [
  {
    href: "/admin/demo/employer",
    title: "Employer Dashboard Demo",
    description: "Simulated employer dashboard with candidates, usage, and analytics. No database.",
    icon: BriefcaseIcon,
    color: "from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-800",
    borderColor: "border-blue-500/30 hover:border-blue-500/60",
  },
  {
    href: "/admin/demo/worker",
    title: "Worker Dashboard Demo",
    description: "Simulated worker dashboard with reputation score, jobs, and coworker matches. No database.",
    icon: UserCircleIcon,
    color: "from-violet-500 to-violet-700 dark:from-violet-600 dark:to-violet-800",
    borderColor: "border-violet-500/30 hover:border-violet-500/60",
  },
  {
    href: "/admin/demo/ads",
    title: "Advertiser Demo",
    description: "Impressions, CTR, clicks, revenue, and ROI from the simulation engine. No database.",
    icon: MegaphoneIcon,
    color: "from-amber-500 to-amber-700 dark:from-amber-600 dark:to-amber-800",
    borderColor: "border-amber-500/30 hover:border-amber-500/60",
  },
  {
    href: "/admin/demo/analytics",
    title: "Analytics Simulator",
    description: "Rehire probability, team compatibility, workforce risk. Pure simulation, no feature flags.",
    icon: ChartBarIcon,
    color: "from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800",
    borderColor: "border-emerald-500/30 hover:border-emerald-500/60",
  },
  {
    href: "/admin/demo/workforce-risk",
    title: "Workforce Risk Dashboard",
    description: "Total employees, % verified, disputes, risk score, high risk count, trend. Behind workforce_risk_dashboard flag.",
    icon: ExclamationTriangleIcon,
    color: "from-slate-500 to-slate-700 dark:from-slate-600 dark:to-slate-800",
    borderColor: "border-slate-500/30 hover:border-slate-500/60",
  },
];

export default async function AdminDemoHubPage() {
  const session = await getServerSession(authOptions);
  const roles = (session?.user as { roles?: string[] })?.roles ?? [];
  if (!roles.includes("admin") && !roles.includes("superadmin")) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
          Demo Simulator
        </h1>
        <p className="mt-2 text-grey-medium dark:text-gray-400">
          Run demos with fake data. No database, no feature flags, no impact on real users.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {demos.map((demo) => {
          const Icon = demo.icon;
          return (
            <Link key={demo.href} href={demo.href} className="block group">
              <Card
                className={`overflow-hidden border-2 ${demo.borderColor} transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
                hover
              >
                <div className={`h-1.5 bg-gradient-to-r ${demo.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl bg-gradient-to-br ${demo.color} p-2.5 text-white shadow-md`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {demo.title}
                    </h2>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-grey-medium dark:text-gray-400 mb-6">
                    {demo.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                    Open demo
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 flex justify-start">
        <Button variant="secondary" href="/admin">
          Back to Admin Panel
        </Button>
      </div>
    </div>
  );
}
