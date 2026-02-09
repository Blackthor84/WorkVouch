import {
  TruckIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  HeartIcon,
  ShoppingBagIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { SafeIcon } from "@/components/ui/SafeIcon";
import { INDUSTRIES, INDUSTRY_DISPLAY_NAMES } from "@/lib/constants/industries";
import type { Industry } from "@/lib/constants/industries";

const INDUSTRY_ICONS: Record<Industry, React.ComponentType<{ className?: string }>> = {
  Security: ShieldCheckIcon,
  Healthcare: HeartIcon,
  "Law Enforcement": CheckBadgeIcon,
  Retail: ShoppingBagIcon,
  Hospitality: BuildingOffice2Icon,
  "Warehouse and Logistics": TruckIcon,
  Education: AcademicCapIcon,
  Construction: WrenchScrewdriverIcon,
};

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
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-200">
          WorkVouch is designed for industries where work history transparency,
          reliability, and accountability matter.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-x-10">
          {INDUSTRIES.map((key) => {
            const Icon = INDUSTRY_ICONS[key];
            const label = INDUSTRY_DISPLAY_NAMES[key];
            return (
              <div
                key={key}
                className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                  <SafeIcon icon={Icon} className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
