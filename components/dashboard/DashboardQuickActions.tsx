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
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
        Quick actions
      </h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {actions.map(({ href, title, description, Icon, className }) => (
          <Link
            key={href}
            href={href}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-md ring-2 transition-all hover:shadow-lg hover:-translate-y-0.5 ${className}`}
          >
            <Icon className="h-8 w-8 opacity-90 mb-3" aria-hidden />
            <p className="text-lg font-bold">{title}</p>
            <p className="text-sm text-white/85 mt-1">{description}</p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-white/95">
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
