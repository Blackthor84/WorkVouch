"use client";

import {
  ShieldCheckIcon,
  HeartIcon,
  CheckBadgeIcon,
  ShoppingBagIcon,
  BuildingOffice2Icon,
  TruckIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { INDUSTRIES, INDUSTRY_DISPLAY_NAMES } from "@/lib/constants/industries";
import type { Industry } from "@/lib/constants/industries";

const CARD_CONFIG: Record<
  Industry,
  { icon: React.ComponentType<{ className?: string }>; copy: string }
> = {
  Security:
    "Guard, patrol, event security, private protection.",
  Healthcare:
    "Nursing, care facilities, medical support roles.",
  "Law Enforcement":
    "Public safety, corrections, investigations.",
  Retail:
    "Customer-facing and operations roles.",
  Hospitality:
    "Hotels, service, event staffing.",
  "Warehouse and Logistics":
    "Distribution, transport, operations.",
  Education:
    "Teachers, administrators, academic staff.",
  Construction:
    "Trades, project crews, contractors.",
};

const ICONS: Record<Industry, React.ComponentType<{ className?: string }>> = {
  Security: ShieldCheckIcon,
  Healthcare: HeartIcon,
  "Law Enforcement": CheckBadgeIcon,
  Retail: ShoppingBagIcon,
  Hospitality: BuildingOffice2Icon,
  "Warehouse and Logistics": TruckIcon,
  Education: AcademicCapIcon,
  Construction: WrenchScrewdriverIcon,
};

export default function BuiltForHighTrustProfessions() {
  return (
    <section
      className="border-y border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
      aria-label="Built for high-trust professions"
    >
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          Built for High-Trust Professions
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-200">
          WorkVouch is designed for industries where reliability, reputation, and
          verified employment matter most.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES.map((key) => {
            const Icon = ICONS[key];
            const copy = CARD_CONFIG[key];
            const label = INDUSTRY_DISPLAY_NAMES[key];
            return (
              <div
                key={key}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">
                  {label}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                  {copy}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
