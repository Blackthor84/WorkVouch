import {
  ShieldCheckIcon,
  UserPlusIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const ITEMS = [
  {
    icon: UserPlusIcon,
    title: "Real peer verification",
    description: "Only people who worked at the same company during overlapping periods can verify employment. No anonymous reviews.",
  },
  {
    icon: DocumentMagnifyingGlassIcon,
    title: "Overlap and tenure checks",
    description: "Dates and roles are checked against coworker records. Mismatches and impossible overlaps are flagged.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Dispute and audit trail",
    description: "Disputes are logged and resolved with a clear record. Trust score changes are versioned and auditable.",
  },
];

export default function HowWePreventFraud() {
  return (
    <section className="border-y border-[#E2E8F0] bg-white py-16 md:py-20" id="fraud-prevention">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 overflow-x-hidden">
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] md:text-3xl">
          How we prevent fraud
        </h2>
        <p className="mt-3 max-w-2xl text-base text-[#334155]">
          Verification is built on real overlap and peer confirmation, not self-reported claims.
        </p>
        <ul className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {ITEMS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex flex-col">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]/10 text-[#2563EB]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-[#0F172A]">{title}</h3>
              <p className="mt-2 text-sm text-[#334155] leading-relaxed">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
