import {
  LockClosedIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

const ITEMS = [
  {
    icon: LockClosedIcon,
    title: "Encryption",
    description: "Data in transit uses TLS. Sensitive data at rest is protected with industry-standard encryption.",
  },
  {
    icon: CircleStackIcon,
    title: "Secure storage",
    description: "Verified employment and profile data are stored in access-controlled, compliant infrastructure.",
  },
  {
    icon: ClipboardDocumentListIcon,
    title: "Audit logs",
    description: "Key actions and trust score changes are logged with timestamps and reasons for accountability.",
  },
];

export default function ComplianceSecuritySection() {
  return (
    <section className="bg-[#F8FAFC] border-y border-[#E2E8F0] py-16 md:py-20" id="compliance-security">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 overflow-x-hidden">
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] md:text-3xl">
          Compliance & security
        </h2>
        <p className="mt-3 max-w-2xl text-base text-[#334155]">
          Built for teams that need clear controls and accountability.
        </p>
        <ul className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          {ITEMS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex flex-col">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#334155]/10 text-[#334155]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-[#0F172A]">{title}</h3>
              <p className="mt-2 text-sm text-[#334155] leading-relaxed">{description}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8">
          <a href="/security" className="text-sm font-medium text-[#2563EB] hover:underline">
            Trust & compliance details →
          </a>
        </p>
      </div>
    </section>
  );
}
