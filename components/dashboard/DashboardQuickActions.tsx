import Link from "next/link";
import { BriefcaseIcon, UserGroupIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const actions = [
  {
    href: "/jobs/new",
    title: "Add Job",
    description: "Build verified work history",
    Icon: BriefcaseIcon,
    className: "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 ring-blue-200/60",
  },
  {
    href: "/coworker-matches",
    title: "Find Coworkers",
    description: "See who overlapped with you",
    Icon: UserGroupIcon,
    className: "from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 ring-sky-200/60",
  },
  {
    href: "/references/request",
    title: "Request Reference",
    description: "Ask for a peer review",
    Icon: DocumentTextIcon,
    className: "from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 ring-violet-200/60",
  },
] as const;

export function DashboardQuickActions() {
  return (
    <section aria-label="Quick actions">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Quick actions
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {actions.map(({ href, title, description, Icon, className }) => (
          <Link
            key={href}
            href={href}
            className={`group relative flex flex-col gap-3 overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-sm ring-2 transition-all hover:-translate-y-0.5 hover:shadow-md ${className}`}
          >
            <Icon className="h-8 w-8 opacity-90" aria-hidden />
            <p className="text-lg font-medium">{title}</p>
            <p className="text-sm text-white/90">{description}</p>
            <span className="mt-auto inline-flex items-center pt-1 text-xs font-medium text-white/90">
                Go
                <span className="ml-1 group-hover:translate-x-0.5 transition-transform" aria-hidden>
                  →
                </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
