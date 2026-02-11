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

const INDUSTRY_LINE =
  "WorkVouch adapts intelligence metrics to this industry's hiring risks and performance expectations.";

export default function BuiltForHighTrustProfessions() {
  return (
    <section className="bg-slate-950 text-white py-20" id="industries">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Built for High-Trust Industries
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {INDUSTRIES.map((key) => {
            const Icon = INDUSTRY_ICONS[key];
            const label = INDUSTRY_DISPLAY_NAMES[key];
            return (
              <div
                key={key}
                className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-700/60 text-slate-300 mb-4">
                  <SafeIcon icon={Icon} className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {label}
                </h3>
                <p className="text-sm text-slate-400 flex-1">
                  {INDUSTRY_LINE}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
