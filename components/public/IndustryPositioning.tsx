import {
  TruckIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  HeartIcon,
  ShoppingBagIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { SafeIcon } from "@/components/ui/SafeIcon";

const industries: { label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Warehouse & Logistics", Icon: TruckIcon },
  { label: "Security", Icon: ShieldCheckIcon },
  { label: "Law Enforcement", Icon: CheckBadgeIcon },
  { label: "Healthcare", Icon: HeartIcon },
  { label: "Retail", Icon: ShoppingBagIcon },
  { label: "Hospitality", Icon: BuildingOffice2Icon },
];

export default function IndustryPositioning() {
  return (
    <section
      className="border-y border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/30"
      aria-label="Industries we serve"
    >
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Built for Reliability-Based Industries
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          WorkVouch is designed for industries where work history transparency,
          reliability, and accountability matter.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-x-10">
          {industries.map(({ label, Icon }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400">
                <SafeIcon icon={Icon} className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
