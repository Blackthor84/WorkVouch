import {
  BriefcaseIcon,
  UserGroupIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    step: 1,
    title: "Employees add their job history",
    description: "Add past employers and roles. Only real jobs, verified later by coworkers.",
    Icon: BriefcaseIcon,
  },
  {
    step: 2,
    title: "Coworkers verify and can leave references",
    description: "People who worked at the same company confirm employment and can leave a reference.",
    Icon: UserGroupIcon,
  },
  {
    step: 3,
    title: "WorkVouch calculates a Reputation Score",
    description: "Based on verified data: overlap, peer confirmation, reference quality, and profile strength.",
    Icon: ChartBarIcon,
  },
];

export default function HowWorkVouchWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20 overflow-x-hidden" id="how-it-works">
      <h2 className="text-center text-2xl font-bold tracking-tight text-[#0F172A] md:text-3xl">
        How It Works
      </h2>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map(({ step, title, description, Icon }) => (
          <Card
            key={step}
            className="border-[#E2E8F0] flex flex-col"
          >
            <CardContent className="flex flex-1 flex-col pt-6">
              <div className="mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#334155]">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                Step {step}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[#0F172A]">
                {title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#334155]">
                {description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
