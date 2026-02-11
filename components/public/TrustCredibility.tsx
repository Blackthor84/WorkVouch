import {
  ShieldCheckIcon,
  UserGroupIcon,
  ChartBarIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const items = [
  {
    icon: ShieldCheckIcon,
    label: "Structured employment verification",
  },
  {
    icon: UserGroupIcon,
    label: "Fraud-resistant reference network",
  },
  {
    icon: ChartBarIcon,
    label: "Employer-grade analytics",
  },
  {
    icon: LockClosedIcon,
    label: "Privacy-controlled public profiles",
  },
];

export default function TrustCredibility() {
  return (
    <section className="border-y border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:py-24">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Built for Modern Workforces
        </h2>
        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          {items.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
