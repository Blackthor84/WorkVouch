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

const INDUSTRY_TAGLINES: Record<Industry, string> = {
  Healthcare: "Patient safety requires verified experience.",
  "Law Enforcement": "Communities depend on vetted professionals.",
  Security: "Verified backgrounds and references matter.",
  Retail: "Trust and turnover both improve with verification.",
  Hospitality: "Guest safety and team reliability start with verification.",
  "Warehouse and Logistics": "Supply chain teams need verified tenure.",
  Education: "Schools need trusted, qualified professionals.",
  Construction: "Teams rely on proven field performance.",
};

export default function BuiltForHighTrustProfessions() {
  return (
    <section className="bg-slate-950 text-white py-20" id="industries">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Built for High-Trust Industries
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {INDUSTRIES.map((key) => {
            const Icon = INDUSTRY_ICONS[key];
            const label = INDUSTRY_DISPLAY_NAMES[key];
            const tagline = INDUSTRY_TAGLINES[key];
            return (
              <div
                key={key}
                className="bg-[#1F2937] border border-[#334155] rounded-xl p-6 flex flex-col transition-[background-color,border-color] hover:bg-[#374151] hover:border-slate-500"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#334155] text-slate-200 mb-4">
                  <SafeIcon icon={Icon} className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {label}
                </h3>
                <p className="text-sm text-slate-200 flex-1">
                  {tagline}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
