import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Compliance & Investor Readiness | WorkVouch",
  description:
    "WorkVouch compliance overview: data protection, reputation fairness, employer controls, and legal safeguards.",
};

const CHECK_SVG = (
  <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

function ChecklistItem({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-md p-6 space-y-4">
      <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
        {title}
      </h2>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-grey-medium dark:text-gray-400">
            {CHECK_SVG}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <div className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-background dark:bg-[#0D1117]">
      <div className="w-full max-w-4xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
            Compliance & Investor Readiness
          </h1>
          <p className="text-lg text-grey-medium dark:text-gray-400 max-w-2xl mx-auto">
            WorkVouch maintains production-grade controls for data protection,
            reputation fairness, employer access, and legal safeguards.
          </p>
        </div>

        <section className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          <ChecklistItem
            title="Data Protection"
            items={[
              "RLS (Row Level Security) enabled on all relevant tables in Supabase.",
              "Role-based access: user, employer, admin with enforced boundaries.",
              "Secure storage for sensitive data; dispute evidence in private bucket.",
              "Signed URLs only for document access; no public exposure of evidence.",
            ]}
          />
          <ChecklistItem
            title="Reputation Fairness"
            items={[
              "Dispute system for employment, references, fraud flags, Trust Score, rehire status.",
              "Appeal system: one appeal per dispute; final decision logged.",
              "Audit logs for dispute resolutions, admin actions, and fraud workflow.",
              "Trust score recalculation server-side when resolution affects verification or flags.",
            ]}
          />
          <ChecklistItem
            title="Employer Controls"
            items={[
              "Tiered access by subscription (Starter, Growth, Pro) with Stripe billing.",
              "Stripe billing enforcement; feature gating by plan.",
              "Metadata and role gating on API routes; employers cannot access admin or user-only data.",
            ]}
          />
          <ChecklistItem
            title="Legal Safeguards"
            items={[
              "Informational scoring disclaimer: Trust Scores are proprietary and informational only; not endorsement or certification.",
              "Employer liability clause: employers responsible for hiring decisions; rehire data is employer-submitted; WorkVouch does not guarantee accuracy of employer input.",
              "Platform limitation: WorkVouch is not a background check service, not a consumer reporting agency (FCRA), and not governed as a credit bureau.",
            ]}
          />
        </section>

        <section className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-md p-8">
          <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Related Resources
          </h2>
          <ul className="space-y-2 text-grey-medium dark:text-gray-400">
            <li>
              <Link href="/legal/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/legal/employer-agreement" className="text-primary hover:underline">
                Employer Agreement
              </Link>
            </li>
            <li>
              <Link href="/how-disputes-work" className="text-primary hover:underline">
                How Disputes Work
              </Link>
            </li>
          </ul>
        </section>

        <div className="border-t border-grey-background dark:border-[#374151] pt-8 text-center text-sm text-grey-medium dark:text-gray-400">
          <p>
            For investor or compliance inquiries:{" "}
            <a href="mailto:legal@workvouch.com" className="text-primary hover:underline">
              legal@workvouch.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
